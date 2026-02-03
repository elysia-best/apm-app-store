import { ipcMain, WebContents } from 'electron';
import { spawn, ChildProcess, exec } from 'node:child_process';
import readline from 'node:readline';
import { promisify } from 'node:util';
import pino from 'pino';

import { ChannelPayload, InstalledAppInfo } from '../../typedefinition';

const logger = pino({ 'name': 'install-manager' });

type InstallTask = {
  id: number;
  pkgname: string;
  execCommand: string;
  execParams: string[];
  process: ChildProcess | null;
  webContents: WebContents | null;
};

const SHELL_CALLER_PATH = '/opt/apm-store/extras/shell-caller.sh';

export const tasks = new Map<number, InstallTask>();

let idle = true; // Indicates if the installation manager is idle

const checkSuperUserCommand = async (): Promise<string> => {
  let superUserCmd = '';
  const execAsync = promisify(exec);
  if (process.getuid && process.getuid() !== 0) {
    const { stdout, stderr } = await execAsync('which /usr/bin/pkexec');
    if (stderr) {
      logger.error('没有找到 pkexec 命令');
      return;
    }
    logger.info(`找到提升权限命令: ${stdout.trim()}`);
    superUserCmd = stdout.trim();

    if (superUserCmd.length === 0) {
      logger.error('没有找到提升权限的命令 pkexec!');
    }
  }
  return superUserCmd;
}

const runCommandCapture = async (execCommand: string, execParams: string[]) => {
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(execCommand, execParams, {
      shell: true,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      resolve({ code: -1, stdout, stderr: err.message });
    });

    child.on('close', (code) => {
      resolve({ code: typeof code === 'number' ? code : -1, stdout, stderr });
    });
  });
};

const parseInstalledList = (output: string) => {
  const apps: Array<InstalledAppInfo> = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('Listing')) continue;
    if (trimmed.startsWith('[INFO]')) continue;

    const match = trimmed.match(/^(\S+)\/\S+,\S+\s+(\S+)\s+(\S+)\s+\[(.+)\]$/);
    if (!match) continue;
    apps.push({
      pkgname: match[1],
      version: match[2],
      arch: match[3],
      flags: match[4],
      raw: trimmed
    });
  }
  return apps;
};

const parseUpgradableList = (output: string) => {
  const apps: Array<{ pkgname: string; newVersion: string; currentVersion: string; raw: string }> = [];
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('Listing')) continue;
    if (trimmed.startsWith('[INFO]')) continue;
    if (trimmed.includes('=') && !trimmed.includes('/')) continue;

    if (!trimmed.includes('/')) continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) continue;
    const pkgToken = tokens[0];
    const pkgname = pkgToken.split('/')[0];
    const newVersion = tokens[1] || '';
    const currentMatch = trimmed.match(/\[(?:upgradable from|from):\s*([^\]\s]+)\]/i);
    const currentToken = tokens[5] || '';
    const currentVersion = currentMatch?.[1] || currentToken.replace('[', '').replace(']', '');

    if (!pkgname) continue;
    apps.push({ pkgname, newVersion, currentVersion, raw: trimmed });
  }
  return apps;
};

// Listen for download requests from renderer process
ipcMain.on('queue-install', async (event, download_json) => {
  const download = JSON.parse(download_json);
  const { id, pkgname, upgradeOnly } = download || {};

  if (!id || !pkgname) {
    logger.warn('passed arguments missing id or pkgname');
    return;
  }

  logger.info(`收到下载任务: ${id},  软件包名称: ${pkgname}`);
  
  // 避免重复添加同一任务，但允许重试下载
  if (tasks.has(id) && !download.retry) {
    tasks.get(id)?.webContents.send('install-log', {
      id,
      time: Date.now(),
      message: `任务id： ${id} 已在列表中，忽略重复添加`
    });
    tasks.get(id)?.webContents.send('install-complete', {
      id: id,
      success: false,
      time: Date.now(),
      exitCode: -1,
      message: `{"message":"任务id： ${id} 已在列表中，忽略重复添加","stdout":"","stderr":""}`
    });
    return;
  }

  const webContents = event.sender;

  // 开始组装安装命令
  let superUserCmd = await checkSuperUserCommand();
  let execCommand = '';
  let execParams = [];
  if (superUserCmd.length > 0) {
    execCommand = superUserCmd;
    execParams.push(SHELL_CALLER_PATH);
  } else {
    execCommand = SHELL_CALLER_PATH;
  }
  execParams.push('apm', 'install', '-y', pkgname);

  const task: InstallTask = {
    id,
    pkgname,
    execCommand,
    execParams,
    process: null,
    webContents
  };
  tasks.set(id, task);
  if (idle) processNextInQueue(0);
});

function processNextInQueue(index: number) {
  if (!idle) return;

  idle = false;
  const task = Array.from(tasks.values())[index];
  const webContents = task.webContents;
  let stdoutData = '';
  let stderrData = '';

  webContents.send('install-status', {
    id: task.id,
    time: Date.now(),
    message: 'installing'
  })
  webContents.send('install-log', {
    id: task.id,
    time: Date.now(),
    message: `开始执行: ${task.execCommand} ${task.execParams.join(' ')}`
  });
  logger.info(`启动安装命令: ${task.execCommand} ${task.execParams.join(' ')}`);

  const child = spawn(task.execCommand, task.execParams, {
    shell: true,
    env: process.env
  });
  task.process = child;

  // 监听 stdout
  child.stdout.on('data', (data) => {
    stdoutData += data.toString();
    webContents.send('install-log', {
      id: task.id,
      time: Date.now(),
      message: data.toString()
    });
  });

  // 监听 stderr
  child.stderr.on('data', (data) => {
    stderrData += data.toString();
    webContents.send('install-log', {
      id: task.id,
      time: Date.now(),
      message: data.toString()
    });
  });
  child.on('close', (code) => {
    const success = code === 0;
    // 拼接json消息
    const messageJSONObj = {
      message: success ? '安装完成' : `安装失败，退出码 ${code}`,
      stdout: stdoutData,
      stderr: stderrData
    };

    if (success) {
      logger.info(messageJSONObj);
    } else {
      logger.error(messageJSONObj);
    }

    webContents.send('install-complete', {
      id: task.id,
      success: success,
      time: Date.now(),
      exitCode: code,
      message: JSON.stringify(messageJSONObj)
    });
    tasks.delete(task.id);
    idle = true;
    if (tasks.size > 0)
      processNextInQueue(0);
  });
}

ipcMain.handle('check-installed', async (_event, pkgname: string) => {
  if (!pkgname) {
    logger.warn('check-installed missing pkgname');
    return false;
  }
  let isInstalled = false;

  logger.info(`检查应用是否已安装: ${pkgname}`);

  let child = spawn(SHELL_CALLER_PATH, ['apm', 'list', '--installed', pkgname], {
    shell: true,
    env: process.env
  });

  let output = '';
  
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  await new Promise<void>((resolve) => {
    child.on('close', (code) => {
      if (code === 0 && output.includes(pkgname)) {
        isInstalled = true;
        logger.info(`应用已安装: ${pkgname}`);
      } else {
        logger.info(`应用未安装: ${pkgname}`);
      }
      resolve();
    });
  });
  return isInstalled;
});

ipcMain.on('remove-installed', async (_event, pkgname: string) => {
  const webContents = _event.sender;
  if (!pkgname) {
    logger.warn('remove-installed missing pkgname');
    return;
  }
  logger.info(`卸载已安装应用: ${pkgname}`);
  
  let superUserCmd = await checkSuperUserCommand();
  let execCommand = '';
  let execParams = [];
  if (superUserCmd.length > 0) {
    execCommand = superUserCmd;
    execParams.push(SHELL_CALLER_PATH);
  } else {
    execCommand = SHELL_CALLER_PATH;
  }
  let child = spawn(execCommand, [...execParams, 'apm', 'remove', '-y', pkgname], {
    shell: true,
    env: process.env
  });
  let output = '';
  
  child.stdout.on('data', (data) => {
    const chunk = data.toString();
    output += chunk;
    webContents.send('remove-progress', chunk);
  });

  child.on('close', (code) => {
    const success = code === 0;
    // 拼接json消息
    const messageJSONObj = {
      message: success ? '卸载完成' : `卸载失败，退出码 ${code}`,
      stdout: output,
      stderr: ''
    };

    if (success) {
      logger.info(messageJSONObj);
    } else {
      logger.error(messageJSONObj);
    }

    webContents.send('remove-complete', {
      id: 0,
      success: success,
      time: Date.now(),
      exitCode: code,
      message: JSON.stringify(messageJSONObj)
    } satisfies ChannelPayload);
  });
});

ipcMain.handle('list-upgradable', async () => {
  const { code, stdout, stderr } = await runCommandCapture(
    SHELL_CALLER_PATH,
    ['apm', 'list', '--upgradable']);
  if (code !== 0) {
    logger.error(`list-upgradable failed: ${stderr || stdout}`);
    return {
      success: false,
      message: stderr || stdout || `list-upgradable failed with code ${code}`,
      apps: []
    };
  }

  const apps = parseUpgradableList(stdout);
  return { success: true, apps };
});

ipcMain.handle('list-installed', async () => {
  const superUserCmd = await checkSuperUserCommand();
  const execCommand = superUserCmd.length > 0 ? superUserCmd : SHELL_CALLER_PATH;
  const execParams = superUserCmd.length > 0
    ? [SHELL_CALLER_PATH, 'apm', 'list', '--installed']
    : ['apm', 'list', '--installed'];

  const { code, stdout, stderr } = await runCommandCapture(execCommand, execParams);
  if (code !== 0) {
    logger.error(`list-installed failed: ${stderr || stdout}`);
    return {
      success: false,
      message: stderr || stdout || `list-installed failed with code ${code}`,
      apps: []
    };
  }

  const apps = parseInstalledList(stdout);
  return { success: true, apps };
});

ipcMain.handle('uninstall-installed', async (_event, pkgname: string) => {
  if (!pkgname) {
    logger.warn('uninstall-installed missing pkgname');
    return { success: false, message: 'missing pkgname' };
  }

  const superUserCmd = await checkSuperUserCommand();
  const execCommand = superUserCmd.length > 0 ? superUserCmd : SHELL_CALLER_PATH;
  const execParams = superUserCmd.length > 0
    ? [SHELL_CALLER_PATH, 'apm', 'remove', '-y', pkgname]
    : ['apm', 'remove', '-y', pkgname];

  const { code, stdout, stderr } = await runCommandCapture(execCommand, execParams);
  const success = code === 0;

  if (success) {
    logger.info(`卸载完成: ${pkgname}`);
  } else {
    logger.error(`卸载失败: ${pkgname} ${stderr || stdout}`);
  }

  return {
    success,
    message: success ? '卸载完成' : (stderr || stdout || `卸载失败，退出码 ${code}`)
  };
});

ipcMain.handle('launch-app', async (_event, pkgname: string) => {
  if (!pkgname) {
    logger.warn('No pkgname provided for launch-app');
  }

  const execCommand = "/opt/apm-store/extras/host-spawn";
  const execParams = ['/opt/apm-store/extras/apm-launcher', 'launch', pkgname ];

  logger.info(`Launching app: ${pkgname} with command: ${execCommand} ${execParams.join(' ')}`);

  spawn(execCommand, execParams, {
    shell: false,
    env: process.env,
    detached: true,
    stdio: 'ignore'
  }).unref();
});
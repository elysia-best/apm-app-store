import { ipcMain, WebContents } from 'electron';
import { spawn, ChildProcess, exec } from 'node:child_process';
import readline from 'node:readline';
import { promisify } from 'node:util';
import pino from 'pino';

const logger = pino({ 'name': 'download-manager' });

type DownloadTask = {
  id: number;
  execCommand: string;
  execParams: string[];
  process: ChildProcess | null;
  webContents: WebContents | null;
};

const tasks = new Map<number, DownloadTask>();

let idle = true; // Indicates if the installation manager is idle

// Listen for download requests from renderer process
ipcMain.on('queue-install', async (event, download) => {
  const { id, pkgname } = download || {};

  if (!id || !pkgname) {
    logger.warn('passed arguments missing id or pkgname');
    return;
  }

  logger.info(`收到下载任务: ${id},  软件包名称: ${pkgname}`);
  
  // 避免重复添加同一任务
  if (tasks.has(id)) {
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
  const execAsync = promisify(exec);
  let superUserCmd = '';
  if (process.getuid && process.getuid() !== 0) {
    const { stdout, stderr } = await execAsync('which pkexec');
    if (stderr) {
      logger.error('没有找到 pkexec 命令');
      return;
    }
    logger.info(`找到提升权限命令: ${stdout.trim()}`);
    superUserCmd = stdout.trim();

    if (superUserCmd.length === 0) {
      logger.error('没有找到提升权限的命令 pkexec, 无法继续安装');
      webContents.send('install-error', {
        id,
        time: Date.now(),
        message: '无法找到提升权限的命令 pkexec，请手动安装'
      });
      return;
    }
  }

  let execCommand = '';
  let execParams = [];
  if (superUserCmd.length > 0) {
    execCommand = superUserCmd;
    execParams.push('/usr/bin/apm');
  } else {
    execCommand = '/usr/bin/apm';
  }
  execParams.push('install', '-y', pkgname);

  const task: DownloadTask = {
    id,
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
import { BrowserWindow } from 'electron';
import { deepLink } from './deeplink';

deepLink.on("event", (query) => {
  console.log(`Deep link: event "event" fired with query: ${JSON.stringify(query)}`);
});

deepLink.on("action", (query) => {
  console.log(`Deep link: event "action" fired with query: ${JSON.stringify(query)}`);
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;

  if (query.cmd === 'update') {
    win.webContents.send('deep-link-update');
    if (win.isMinimized()) win.restore();
    win.focus();
  } else if (query.cmd === 'list') {
    win.webContents.send('deep-link-installed');
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

deepLink.on("install", (query) => {
  console.log(`Deep link: event "install" fired with query: ${JSON.stringify(query)}`);
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;

  if (query.pkg) {
    win.webContents.send('deep-link-install', query.pkg);
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

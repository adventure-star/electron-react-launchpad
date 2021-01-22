import {app, BrowserWindow} from 'electron';
import {throttle} from 'lodash';
import {getWindowManager} from './lib/window-manager';
import {getPathToFile} from './lib/utils';
import {createRPC} from './lib/rpc';
import {loadFile, openFile, newFile} from './lib/files';
const {
  join
} = require('path');

const windowManager = getWindowManager();

export function setupWindows() {
  console.log('setup');
  // Intro Screen
  windowManager.setBuildProcedure('splash', (callback, options) => {
    const win = new BrowserWindow({
      width: 285,
      height: 285,
      modal: true,
      show: false,
      frame: false,
      resizable: false,
      icon: join(__dirname, '/../../build/icon.png'),
      ...options
    });

    win.loadURL(getPathToFile('views/splash.html'));

    win.once('ready-to-show', () => {
      win.show();
    });

    return win;
  });

  windowManager.setBuildProcedure('main', callback => {
    // Create the browser window.
    const win = new BrowserWindow({
      width: 870,
      height: 550,
      minWidth: 680,
      minHeight: 500,
      title: app.getName(),
      icon: join(__dirname, '/../../build/icon.png'),
      titleBarStyle: 'hidden-inset',
      show: process.env.NODE_ENV === 'development',
      vibrancy: 'light'
    });

    win.loadURL(getPathToFile('views/index.html'));

    const rpc = createRPC(win);
    win.rpc = rpc;

    win.isIntro = () => {
      return win.getTitle().toLowerCase().match(/welcome/i) !== null;
    };

    // When user drops a file on the window
    win.webContents.on('will-navigate', (e, url) => {
      e.preventDefault();
      loadFile(url, win);
    });

    rpc.on('open-file-dialog', () => {
      openFile();
    });

    rpc.on('new-file-dialog', () => {
      newFile();
    });

    win.once('ready-to-show', () => {
      win.show();
    });

    rpc.once('init', () => {
      if (callback) {
        callback(win, rpc);
      }
    });

    win.on('resize', throttle(() => {
      rpc.emit('size-change', win.getSize());
    }, 2000));

    win.once('closed', () => {
      windowManager.deregister(win);
    });

    return win;
  });

  windowManager.setBuildProcedure('file-manager', (callback, options) => {
    const win = new BrowserWindow({
      width: 650,
      height: 450,
      modal: true,
      show: false,
      resizable: false,
      ...options
    });

    win.loadURL(getPathToFile('views/file-manager.html'));

    win.once('ready-to-show', () => {
      win.show();
    });

    return win;
  });
}

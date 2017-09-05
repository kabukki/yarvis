'use strict';

const electron  = require('electron');
const { app, BrowserWindow, Menu } = electron;
const Store = require('electron-store');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600, minWidth: 800,
    height: 1000, minHeight: 600,
    center: true,
    title: app.getName(),
  });
  mainWindow.loadURL(`file://${__dirname}/../views/index.html`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/*
 * Config
 */

new Store({
  name: 'config',
  defaults: {
    name: '',
    archives: {
      directory: '',
      autoArchive: false,
    },
    git: {
      apis: {
        github: {
          name: 'GitHub',
          username: '',
          password: '',
          privateKey: '',
          authentication: 'basic',
        },
        blih: {
          name: 'BLIH',
          username: '',
          legacyUsername: '',
          password: '',
          privateKey: '',
        },
      },
    },
    languages: {
      c: {
        name: 'C',
        color: 'violet',
        icon: 'devicon-c-plain',
        extensions: [
          '.c',
          '.h',
        ],
      },
      cplusplus: {
        name: 'C++',
        color: 'olive',
        icon: 'devicon-cplusplus-plain',
        extensions: [
          '.cpp',
          '.hpp',
          '.h',
        ],
      },
      javascript: {
        name: 'Javascript',
        color: 'yellow',
        icon: 'devicon-javascript-plain',
        extensions: [
          '.js',
        ],
      },
      other: {
        name: 'Other',
        color: 'grey',
        icon: 'help icon',
        extensions: [],
      },
    },
    projects: {
      directory: app.getPath('home'),
      boilerplates: '',
    },
  },
});

/*
 * User Data
 */
new Store({
  name: 'data',
  defaults: {
    projects: [],
    libraries: [],
  },
});

/*
 * Event listeners
 */
app.on('ready', () => {
  createWindow();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Dev Tools',
      click: () => mainWindow.webContents.openDevTools(),
      accelerator: 'Ctrl+Shift+I',
    }
  ]));
})
.on('activate', () => {
  if (mainWindow == null)
    createWindow();
})
.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});

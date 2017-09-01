'use strict';

/*
 * Main Process
 */

const electron	= require('electron');
const {app, BrowserWindow, Menu} = electron;
const Store = require('electron-store');

/*
 * Main window
 */
let mainWindow;

function createWindow () {
	mainWindow = new BrowserWindow({
		width: 1600, minWidth: 800,
		height: 1000, minHeight: 600,
		center: true,
		title: app.getName()
	});
	mainWindow.loadURL(`file://${__dirname}/index.html`);
	mainWindow.on('closed', () => {
		mainWindow = null;
	})
	mainWindow.setProgressBar(0);
	// debug
	mainWindow.webContents.openDevTools();
	electron.shell.beep();
}

/*
 * Config
 */

const config = new Store({
	name: 'config',
	defaults: {
		"name": "",
		"archives": {
			"directory": "",
			"autoArchive": false
		},
		"git": {
			"apis": {
				"github": {
					"username": "",
					"password": "",
					"privateKey": "",
					"authentication": "basic"
				},
				"blih": {
					"username": "",
					"legacyUsername": "",
					"password": "",
					"privateKey": ""
				},
				"other": {
					"username": "",
					"password": "",
					"privateKey": ""
				}
			}
		},
		"languages": {
			"c": {
				"name": "C",
				"color": "violet",
				"extensions": [
					".c",
					".h"
				]
			},
			"cplusplus": {
				"name": "C++",
				"color": "olive",
				"extensions": [
					".cpp",
					".hpp",
					".h"
				]
			},
			"javascript": {
				"name": "Javascript",
				"color": "yellow",
				"extensions": [
					".js"
				]
			}
		},
		"projects": {
			"directory": "",
			"boilerplates": ""
		}
	}
});

/*
 * User Data
 */
const data = new Store({
	name: 'data',
	defaults: {
		'projects': [],
		'archives': [],
		'libraries': []
	}
});

/*
 * Event listeners
 */
app.on('ready', () => {
	createWindow();
	Menu.setApplicationMenu(null)
})
.on('activate', () => {
	if (mainWindow == null)
		createWindow();
})
.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

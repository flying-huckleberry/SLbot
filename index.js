/*

    index.js

    Controls the life cycle of the app & its modules
    Acts as the main process
    Relays messages to and from render processes

    By Huckleberry
______________________________________________________*/

const path = require('path')
const {app, BrowserWindow, ipcMain} = require('electron')
//----------------------------------
//const Bot = require('./bot.js')
//const Server = require('./server.js')
//const Logger = require('./logger.js')
const Config = require('./config.json')

let mainWindow
//----------------------------------
//vars for easy logging
const e = 'error'
const i = 'info'
const t = 'task'
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') { app.quit() }
})

app.on('activate', function () {
  if (mainWindow === null) { createWindow() }
})


ipcMain.on('log', (event, arg) => {
  //event.sender.send('ack', {'msg':'ok'})
  mainWindow.webContents.send('log', arg)
})

ipcMain.on('relay-update', (event, arg) => {
  mainWindow.webContents.send('relay-update', arg)
})

// ipcMain.on('web-state', (event, currentlyOn) => {
//   currentlyOn ? Web.turnOff() : Web.turnOn()
//   event.sender.send('web-state', Web.isOn() ? true : false)
// })

// ipcMain.on('bot-state', (event, currentlyOn) => {
//   currentlyOn ? Bot.turnOff() : Bot.turnOn()
//   event.sender.send('bot-state', Bot.isOn() ? true : false)
// })

// ipcMain.on('cron-state', (event, current) => {
//   current ? Cron.turnOff() : Cron.turnOn()
//   event.sender.send('cron-state', Cron.isOn() ? true : false)
// })

/*
  createWindow
  creates the window the app command interface is served to
_________________________________________________________________*/
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    // width: Config.app.width,
    // height: Config.app.height,
    width: 1000,
    height: 600,
    icon: path.join(__dirname, 'views/assets/icons/png/64x64.png'),
    backgroundColor: '#2E2C29',
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    console.log('ready-to-show')
    mainWindow.show()
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./views/server/index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('did-finish-load')
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  require(path.join(__dirname, 'menu/mainmenu'))
}

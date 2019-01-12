/*

    server.js

    Serves SLbot Web Server & API
    SLbot website can be accessed from a browser
    SLbot functions can be accessed from an API request
      (your IP/domain) (remember to port forward 80:4000)

    By Huckleberry
______________________________________________________*/
const Express = require('express')
const Path = require('path')
const fs = require('fs');
const BodyParser = require('body-parser')
const {ipcRenderer, BrowserWindow} = require('electron')
const Web = Express()
const helmet = require('helmet')
var Server = false
//----------------------------------
const API = require('./api/db_api.js')
var Config = require('./config.json')
const Logger = require('./logger.js')
let mainWindow
//----------------------------------
Web.use(helmet())
Web.use(helmet.referrerPolicy({ policy: 'same-origin' }))
Web.use(BodyParser.urlencoded({ extended: true }))
Web.use(BodyParser.json({limit:Config.web.jsonsizelimit}))
Web.use('/js', Express.static('./views/js'))
Web.use('/css', Express.static('./views/css'))
Web.use('/json_viewer', Express.static('./node_modules/jquery.json-viewer/json-viewer/'))
Web.use('/assets', Express.static('./views/assets'))
Web.set('view engine', 'ejs')
//----------------------------------
//vars for easy logging
const e = 'error'
const i = 'info'
const t = 'task'

// ipcMain.on('ack', function(data) {
//   console.log()
// })


//---------------------
// Web calls
//---------------------

//serve index page
Web.get('/', (request, response) => {
  let str = 'GET  /index'
  Logger.log(str, i)
  response.render('html/index', {
      title: Config.web.name,
      name: Config.web.name,
      logo: Config.web.logo,
      treeView: Config.web.treeview
  })
})
//serve API fetch page
Web.get('/command', (request, response) => {
  let str = 'GET  /command'
  Logger.log(str, i)
  response.render('html/command', {
    title: 'SLbot Command Interpreter',
    name: Config.web.name,
    logo: Config.web.logo,
    prefix: Config.bot.prefix
  })
})
//server API index
Web.get('/api', (request, response) => {
  let str = 'GET  /api'
  Logger.log(str, i)
  response.render('html/api', {
    title: 'SLbot API Overview',
    name: Config.web.name,
    logo: Config.web.logo
  })
})
//serve about page
Web.get('/about', (request, response) => {
  let str = 'GET  /about'
  Logger.log(str, i)
  response.render('html/about', {
    title: 'SLbot Info',
    name: Config.web.name
  })
})

//---------------------
// API calls
//---------------------

//API for web call
Web.post('/api/fetch', (request, response) => {
  let str = 'POST /api/fetch'
  Logger.log(str, i)
  response.json(API.getFullStats()) //send them the data they need
})
//API for servers query
Web.post('/api/servers', (request, response) => {
  let str = 'POST /api/servers'
  Logger.log(str, i)
  response.json(API.getServers()) //send them the data they need
})
//API for hours query
Web.post('/api/hours', (request, response) => {
  let str = 'POST /api/hours "'+request.body.command+'"'
  ipcRenderer.send('log', 'GET  /index')
  Logger.log(str, i)
  response.json(API.getHours(sanitizeCmd(request.body.command))) //send them the data they need
})
//API for kills query
Web.post('/api/kills', (request, response) => {
  let str = 'POST /api/kills "'+request.body.command+'"'
  Logger.log(str, i)
  response.json(API.getKills(sanitizeCmd(request.body.command))) //send them the data they need
})
//API for deaths query
Web.post('/api/deaths', (request, response) => {
  let str = 'POST /api/deaths "'+request.body.command+'"'
  Logger.log(str, i)
  response.json(API.getDeaths(sanitizeCmd(request.body.command))) //send them the data they need
})
//API for types list
Web.post('/api/types', (request, response) => {
  let str = 'POST /api/types'
  Logger.log(str, i)
  response.json(API.getTypes()) //send them the data they need
})
//API for SLSC Servers
//update the database with new info
Web.post('/api/dcs/slmod/update', (request, response) => {
  let str = 'POST /api/dcs/slmod/update from '+request.body.name
  Logger.log(str,i)
  console.log(request.body.stats)
  var error = API.update(request.body) //update the stats and server info
  if (error) {
    response.end('fail')
    Logger.log(error, e)
  } else {
    response.end('pass')
    if (Config.bot.sendupdatemessages) {
      ipcRenderer.send('relay-update', request.body.name)
    }
    checkSize() //alert if dataset encroaching on max size
  }
})


/*
  sanitizeCmd
  sanitizes and formats the raw string command from the user
_________________________________________________________________*/
function sanitizeCmd(input) {
  input = input.split(' ')
  //sanitize the array
  for (var i in input) {
    input[i] = input[i].toLowerCase().replace(/[^\w\s]/gi, '')
  }
  return {
    'command': input[0],
    'args': input.slice(1) //array slice the command off the args list
  }
}

function checkSize() {
  let size = API.getDBSize()
  let limit = parseFloat(Config.web.jsonsizelimit.replace('mb',''))
  Logger.log(
    (limit-3 < size)
      ? 'Warning: Database is '+parseFloat(limit-size)+' mb away from exceeding the '
      +Config.web.jsonsizelimit+' threshold.  Consider increasing the "JSON Max Size" value in Web Server Config and restarting the Web Server.'
      : 'Warning: Delete me, JSON is within limits.'
    , e);
}

/*
  Module Export functions
  allows control of web server life cycle from main process
_________________________________________________________________*/
function turnOn() {
  //serve app
  Logger.log('Web Server starting...', i)
  Server = Web.listen(Config.web.port || 4000)
  if (Server && Server.listening) { Logger.log('Web server AWAKE on port ' + Config.web.port, i) }
}

function turnOff() {
  Logger.log('Web Server stopping...', i)
  Server.close(function() { Logger.log('Web Server STOPPED', t) })
}

function refreshConfig() {
  Config = require('./config.json')
}

function clearCache() {
  API.clearCache();
}

function updateAircraft() {
  API.updateAircraft();
}

module.exports = {
  turnOn: function() {turnOn() },
  turnOff: function() { turnOff() },
  isOn: function() { return Server? Server.listening : false },
  refreshConfig: function() { refreshConfig() },
  clearCache: function() { clearCache() },
  updateAircraft: function() { updateAircraft() }
}

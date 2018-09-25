/*

    index.js

    Serves SLbot Web Server & API
    SLbot website can be accessed from a browser
      (your IP/domain) (remember to port forward 80:4000)
    SLbot functions can be accessed from an API request
      (your IP/domain) (remember to port forward 80:4000)

    By Huckleberry
______________________________________________________*/
try {
  const EXPRESS = require('express');
} catch(e) {
  console.log('---------------------------------------------------------');
  console.log('You most likely still need to run the command "npm update"');
  console.log('or execute "Update_SLbot.bat" in the project root folder');
  console.log('---------------------------------------------------------');
  return;
}
EXPRESS = require('express');
const BODYPARSER = require('body-parser');
const APP = EXPRESS();
//----------------------------------
const API = require('./api/db_api.js');
const BOT = require('./bot.js');
const CONFIG = require('./config.json');
const TYPES = require('./registry/types.json');
const LOGGER = require('./logger.js');
//----------------------------------
APP.use(BODYPARSER.urlencoded({ extended: true }));
APP.use(BODYPARSER.json({limit:CONFIG.web.jsonsizelimit}));
APP.use('/js', EXPRESS.static('./views/js'));
APP.use('/css', EXPRESS.static('./views/css'));
APP.use('/json_viewer', EXPRESS.static('./node_modules/jquery.json-viewer/json-viewer/'));
APP.use('/assets', EXPRESS.static('./views/assets'));
APP.set('view engine', 'ejs');
//----------------------------------
//vars for easy logging
const e = 'error';
const i = 'info';
const t = 'task';

//---------------------
// WEB calls
//---------------------

//serve index page
APP.get('/', (request, response) => {
  LOGGER.log('GET  /index', i);
  response.render('html/index', {
      title: CONFIG.web.name,
      name: CONFIG.web.name,
      logo: CONFIG.web.logo,
      treeView: CONFIG.web.treeview
  });
});
//serve API fetch page
APP.get('/command', (request, response) => {
  LOGGER.log('GET  /command', i);
  response.render('html/command', {
    title: 'SLbot Command Interpreter',
    name: CONFIG.web.name,
    logo: CONFIG.web.logo,
    prefix: CONFIG.bot.prefix
  });
});
//server API index
APP.get('/api', (request, response) => {
  LOGGER.log('GET  /api', i);
  response.render('html/api', {
    title: 'SLbot API Overview',
    name: CONFIG.web.name,
    logo: CONFIG.web.logo
  });
});
//serve about page
APP.get('/about', (request, response) => {
  LOGGER.log('GET  /about', i);
  response.render('html/about', {
    title: 'SLbot Info',
    name: CONFIG.web.name
  });
});

//---------------------
// API calls
//---------------------

//API for web call
APP.post('/api/fetch', (request, response) => {
  LOGGER.log('POST /api/fetch', i);
  response.json(API.getFullStats()); //send them the data they need
});
//API for servers query
APP.post('/api/servers', (request, response) => {
  LOGGER.log('POST /api/servers', i);
  response.json(API.getServers()); //send them the data they need
});
//API for hours query
APP.post('/api/hours', (request, response) => {
  LOGGER.log('POST /api/hours "'+request.body.command+'"', i);
  response.json(API.getHours(sanitizeCmd(request.body.command))); //send them the data they need
});
//API for kills query
APP.post('/api/kills', (request, response) => {
  LOGGER.log('POST /api/kills "'+request.body.command+'"', i);
  response.json(API.getKills(sanitizeCmd(request.body.command))); //send them the data they need
});
//API for deaths query
APP.post('/api/deaths', (request, response) => {
  LOGGER.log('POST /api/deaths "'+request.body.command+'"', i);
  response.json(API.getDeaths(sanitizeCmd(request.body.command))); //send them the data they need
});
//API for types list
APP.post('/api/types', (request, response) => {
  LOGGER.log('POST /api/types "', i);
  response.json(API.getTypes()); //send them the data they need
});
//API for SLSC Servers
//update the database with new info
APP.post('/api/dcs/slmod/update', (request, response) => {
  LOGGER.log('POST /api/dcs/slmod/update from '+request.body.name, i);
  var error = API.update(request.body); //update the stats and server info
  if (error) {
    response.end('fail');
    LOGGER.log(error, e);
  } else {
    response.end('pass');
    if (CONFIG.bot.sendupdatemessages) { BOT.announceUpdate(request.body.name) }
  }
});

//serve app
APP.listen(CONFIG.web.port || 4000, function() {
  LOGGER.log('SLbot awakens on port ' + CONFIG.web.port, t);
});

/*
  sanitizeCmd
  sanitizes and formats the raw string command from the user
_________________________________________________________________*/
function sanitizeCmd(input) {
  input = input.split(' ');
  //sanitize the array
  for (var i in input) {
    input[i] = input[i].toLowerCase().replace(/[^\w\s]/gi, '');
  }
  return {
    'command': input[0],
    'args': input.slice(1) //array slice the command off the args list
  };
}

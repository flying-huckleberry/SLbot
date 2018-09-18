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
  console.log('');
  console.log('Slow down there, Slick! You most likely still need to run the command "npm update"');
  console.log('( or execute the "Update_SLbot.bat" file in the project root folder )');
  console.log('');
  console.log('Otherwise, the real issue is that I cannot successfully "require(\'express\')" at the top of index.js');
  console.log('');
  return;
}
EXPRESS = require('express');
const BODYPARSER = require('body-parser');
const APP = EXPRESS();
//----------------------------------
const API = require('./api/db_api.js');
const BOT = require('./bot.js');
const CONFIG = require('./config.json');
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
//----------------------------------
//serve index page
APP.get('/', (request, response) => {
    response.render('html/index', {
        title: CONFIG.web.name,
        name: CONFIG.web.name,
        logo: CONFIG.web.logo,
        treeView: CONFIG.web.treeview
    });
});
//serve about page
APP.get('/about', (request, response) => {
  response.render('html/about', {
    title: 'SLbot Info',
    name: CONFIG.web.name
  });
});

//API for web call
APP.post('/api/web/fetch', (request, response) => {
  LOGGER.log('/api/web/fetch', i);
  response.json(API.getFullStats()); //send them the data they need
});

//API for servers query
APP.post('/api/servers', (request, response) => {
  LOGGER.log('/api/servers', i);
  response.json(API.getServers()); //send them the data they need
});

//API for hours query
APP.post('/api/hours', (request, response) => {
  LOGGER.log('/api/hours', i);
  response.json(API.getHours(request.body)); //send them the data they need
});

//API for kills query
APP.post('/api/kills', (request, response) => {
  LOGGER.log('/api/kills', i);
  response.json(API.getKills(request.body)); //send them the data they need
});

//API for deaths query
APP.post('/api/deaths', (request, response) => {
  LOGGER.log('/api/deaths', i);
  response.json(API.getDeaths(request.body)); //send them the data they need
});

//API for SLSC Server
//update the database with new info
APP.post('/api/dcs/slmod/update', (request, response) => {
  LOGGER.log('/api/dcs/slmod/update from '+req.body.name, i);
  var error = API.update(request.body); //update the stats and server info
  if (error) {
    LOGGER.log(error, e);
    response.end('fail');
  } else { res.end('pass') }
});

//serve app
APP.listen(CONFIG.web.port || 4000, function() {
  LOGGER.log('SLbot Server listening on port ' + CONFIG.web.port, t);
});

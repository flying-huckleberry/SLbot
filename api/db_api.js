/*

    api/db_api.js

    Functions and Helper Functions designed to
    Interact with the SLbot Database,
    return Results to API queries,
    return informative Error Messages

    By Huckleberry
______________________________________________________*/
const jsondb = require('node-json-db');

const CONFIG = require('../config.json');
const TOKENS = require('../tokens.json');
const LOGGER = require('../logger.js');

//vars for easy logging
const e = 'error';
const i = 'info';
const t = 'task';

const ERROR = 'ERROR';

//database references
const DB = 'api/db/' + CONFIG.web.database;
const BDB = 'api/db/' + CONFIG.web.backupdatabase;

//array of possible aircraft type matches
const types = [
  'UH-1H',
  'ah-64d',
  'CobraH',
  'Ka-50',
  'Mi-8MT',
  'SA342L',
  'SA342M',
  'A-10C',
  'F-15C',
  'F-5E-3',
  'F-86F Sabre',
  'P-51D',
  'IL-76MD',
  'MiG-15bis',
  'MiG-21Bis',
  'MiG-29A',
  'MiG-29S',
  'Su-25',
  'Su-25T',
  'Su-27',
  'AJS37',
  'Bf-109K-4',
  'FW-190D9',
  'L-39C',
  'L-39ZA',
  'M-2000C',
  'SpitfireLFMkIX'
];
var cleantypes = [];

//-------------------------------------
// HELPER FUNCTIONS
//-------------------------------------


/*
  refreshNameLoopupTable
  for better effciciency keep player hashes and make lookup table
_________________________________________________________________*/
// function refreshNameLoopupTable() {
//   let db = new jsondb(DB, true, true);
//   let servers = db.getData('/server');
//   db.push('/name_hash', json);
// }



/*
  cleanTypes
  sanitize types array defined above
_________________________________________________________________*/
function cleanTypes() {
  for (var idx = 0; idx < types.length; idx++) {
    cleantypes[idx] = types[idx]
                      .toLowerCase()
                      .replace(/[^\w\s]/gi, '');
  }
}
cleanTypes(); //do it now
/*
  updateTokens
  update tokens in the db with whats in the config
_________________________________________________________________*/
function updateTokens() {
  var db = new jsondb(DB, true, true);
  db.push('/token',TOKENS);
}
updateTokens(); //do it now
/*
  updateTokens
  update tokens in the db with whats in the config
_________________________________________________________________*/
function sanitize(data) {
  return data.toLowerCase().replace(/[^\w\s]/gi, '');
}
/*
  updateTokens
  update tokens in the db with whats in the config
_________________________________________________________________*/
//helper function matchNames to partial
function matchNames(needle, haystack) {
  //find name
  let nameMatches = {};
  for (var k in haystack) {
    if (sanitize(haystack[k]['name']).includes(needle)) {
      //console.log(`found ${needle} in ${haystack[k]['name']}`);
      nameMatches[k] = haystack[k]['name'];
    }
  }
  return nameMatches;
}
/*
  updateTokens
  update tokens in the db with whats in the config
_________________________________________________________________*/
//helper function matchTypes to partial
function matchTypes(needle) {
  //build list of types matching the partial typep
  let typeMatches = [];
  for (var k in cleantypes) {
    if (cleantypes[k].includes(needle)) {
      //console.log('found '+needle+' in '+cleantypes[k]);
      typeMatches.push(types[k]);
    }
  }
  return typeMatches;
}
/*
  updateTokens
  update tokens in the db with whats in the config
_________________________________________________________________*/
//helper function deTokenize:
//sanitize revealing metadata (id/token pair) from each server object
function deTokenize(json) {
  Object.keys(json).forEach(function(k) {
    delete json[k]['id'];
    delete json[k]['token'];
  });
  return json;
}
/*
  integerIncrementNameHashes
  removes hashes from the stats json, TODO dont do this
_________________________________________________________________*/
function integerIncrementNameHashes(json) {
  var id = 1;
  for (var hash in json['stats']) { //for each hashed player node
    json['stats'][id++] = json['stats'][hash]; //make a new node as integer ID
    delete json['stats'][hash]; //delete the old hashed node
  }
  return json;
}
/*
  setDisplayNames
  helpful for units with standard handle tags
_________________________________________________________________*/
function setDisplayNames(json) {
  for (var pid in json['stats']) { //for each hashed player node
    var lastName;
    for (var id in json['stats'][pid]['names']) {
      var foundOfficial = false;
      //if this has the pattern in the config, use this name
      if (json['stats'][pid]['names'][id].indexOf(CONFIG.web.tag) != -1) {
        json['stats'][pid]['name'] = json['stats'][pid]['names'][id];
        foundOfficial = true;
        break;
      }
      lastName = json['stats'][pid]['names'][id];
    }
    if (!foundOfficial) {
      //console.log('didnt find official');
      json['stats'][pid]['name'] = lastName;
    }
  }
  return json;
}
/*
  authorizeToken
  makes sure an SLSC update is valid before committing to DB
_________________________________________________________________*/
function authorizeToken(id, token) {
  var db = new jsondb(DB, true, true);
  try { var tokens = db.getData('/token') }
  catch(err) {
    LOGGER.log('ERROR: Either the DB "'+ DB + '.json" does not exist, or there is no ["token"] index within it',e);
    return false; //dont authorize token
  }
  for (var i in tokens) {
    // LOGGER.log('token = '+token+' = '+tokens[i], e);
    // LOGGER.log(token == tokens[i],e);
    // LOGGER.log('key = '+i + ' = '+id, e);
    // LOGGER.log(i == id,e);
    if (token == tokens[i] && i == id) {
      //console.log('authorized');
      return i; //authorize token
    }
  }
  return false; //dont authorize token
}
/*
  floatingPtHours
  seconds to hours conversion, floating point to 2 decimal places
_________________________________________________________________*/
function floatingPtHours(val) {
  //return (Math.round((100*val/3600))/100); //floating pt hours
  return parseFloat(val/3600).toFixed(2);
}
/*
  calcHours
  grab all the relevant times values and put them in the output
_________________________________________________________________*/
function calcHours(db, nameMatches, typeMatches) {
  let output = {};
  let nal = Object.keys(nameMatches).length;
  let tyl = Object.keys(typeMatches).length;
  //set an output array with just name:{times}
  for (var spid in nameMatches) {
    if (db['stats'][spid]['times'] !== null) {
      output[nameMatches[spid]] = db['stats'][spid]['times'];
    }
  }
  //convert seconds to hours, trim the non-queryd types
  for (var name in output) {
    for (var type in output[name]) {
      if (typeMatches.includes(type)){
        output[name][type]['total'] = floatingPtHours(output[name][type]['total']);
        output[name][type]['inAir'] = floatingPtHours(output[name][type]['inAir']);
      } else {
        delete output[name][type];
      }
    }
  }
  return output;
}
/*
  addHours
  adds 1 hours array to another if the request is for all servers
_________________________________________________________________*/
function addHours(list, aList) {
  for (var name in aList) {
    //console.log(' ? includes '+name);
    //same name in both lists, concat
    if (Object.keys(list).includes(name)) {
      //console.log('yes, has name '+name+', adding to ['+name+']');
      if (!aList[name] || aList[name] == {}) {
        //console.log('name not in aList, do nothing to list[name]');
      } else {
        for (var type in aList[name]) {
          //same type, add inAir and Total hours
          if (type in list[name]) {
            //console.log(name+' has type '+type+', adding to ['+name+']['+type+']');
            list[name][type]['inAir'] += aList[name][type]['inAir'];
            list[name][type]['total'] += aList[name][type]['total'];
          } else {
            //console.log('list['+name+'] doesnt have type '+type+', adding whole ['+type+']');
            list[name][type] = aList[name][type];
          }
        }
      }



    } //new user here not in og list, add if not empty
    else if (aList[name] != {}) { list[name] = aList[name] }
    else {console.log('skipping empty set for '+name)}
  }
  return list;
}
/*
  singleHours
  returns an hours object for a single server
_________________________________________________________________*/
function singleHours(CMD, server = false) {
  let fdb = new jsondb(DB, true, true);
  try { var serverdb = fdb.getData('/server') }
  catch(err) {
    return LOGGER.log('API request for data, but no data is available.',i);
  }
  server = CMD.args[2] || server; //we'd rather use server id defined in CMD
  if (server in serverdb) {
    let nameMatches = matchNames(CMD.args[0], serverdb[server]['stats']);
    //if no names matching that pattern
    if (Object.keys(nameMatches).length == 0) {
      return LOGGER.log('Cannot find name matching `'+CMD.args[0]+'` in `'+server+'`', i);
    }
    let typeMatches = matchTypes(CMD.args[1]);
    if (Object.keys(typeMatches).length == 0) {
      return LOGGER.log("Cannot find aircraft type matching `"+CMD.args[1]+"` in\n{ `"+cleantypes.join('`, `')+"` }", i);
    }
    //server, name, type are clean. lets do the thing!
    //send the server json, the whitelisted names and whitelisted types
    return calcHours(serverdb[server], nameMatches, typeMatches);
  } else {
    return LOGGER.log("Server ID `"+server||'undefined'+"` is invalid, should be one of these:\n{ `"+Object.keys(serverdb).join('`, `')+"` }",i);
  }
  return LOGGER.log('generic error', e);
}
/*
  singleKills
  returns a kills object for a single server
_________________________________________________________________*/
function singleKills(CMD, server = false) {

}
/*
  singleDeaths
  returns a deaths object for a single server
_________________________________________________________________*/
function singleDeaths(CMD, server = false) {

}

//-------------------------------------
// API CALLS
//-------------------------------------

/*
  update
  updates the databases with new stats
_________________________________________________________________*/
function update(json) {
  var serverId = authorizeToken(json['id'], json['token']);
  if (serverId === false) {
    return 'Invalid Token, Aborting DB Update';
  } else { LOGGER.log('Token validated, server ID: ' + serverId, i) }
  LOGGER.log('Performing DB update and backup...',i);
        //The second argument is used to tell the DB to save after each push
        //If you put false, you'll have to call the save() method.
        //The third argument is to ask JsonDB to save the database in an human readable format. (default false)
  var db = new jsondb(DB, true, true);
  var backupdb = new jsondb(BDB, true, true);
  try { var prevjson = db.getData('/') }
  catch(err) { return 'ERROR: Either the DB "'+ DB + '.json" does not exist, or there is no-thing "{}" within it' }
  backupdb.push('/', prevjson);
  LOGGER.log('Updated Backup DB',i);
  json = integerIncrementNameHashes(json); //TODO dont do this step
  json = setDisplayNames(json);
  db.push('/server/'+json['id'], json);
  LOGGER.log('Updated Main DB',i);
      //https://github.com/Belphemur/node-json-db
      //Deleting data
      //db.delete("/info");
}
/*
  getFullStats
  returns the entire server json  currently stored in the main db
_________________________________________________________________*/
function getFullStats() {
  var fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    LOGGER.log('ERROR: Trying to send data to web client, but no data is available.',e);
    LOGGER.log('(Have you started recieving SLmod Stats data yet from any SLSC servers?)',i);
    LOGGER.log('Technical info: Either the DB "'+ DB + '.json" does not exist, or there is no ["server"] index within it',i);
    return false; //return empty object
  }
  return deTokenize(json);
}
/*
  getServers
  returns a list of the servers we have stats for as JSON
_________________________________________________________________*/
function getServers() {
  let fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    return LOGGER.log('API request for data, but no data is available.',i);
  }
  Object.keys(json).forEach(function(k) {
    json[k] = json[k]['name']; //key is id, value is name
  });
  return json;
}
/*
  getHours
  returns hour statistics as JSON
_________________________________________________________________*/
//helper function getHours
function getHours(CMD) {
  let fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    return LOGGER.log('API request for data, but no data is available.',i);
  }
  //console.log(`finding ${CMD.args[2]} recorded ${CMD.command} for ${CMD.args[0]} in type ${CMD.args[1]}`);
  if (!CMD.args[2]) {
    let list = {};
    let first = true;
    for (var serverKey in json) {
      //if first, define the first list
      if (first) {
        list = singleHours(CMD, serverKey);
        first = false;
      //if not first, add with first
      } else {
        let addingList = singleHours(CMD, serverKey);
        list = addHours(list, addingList);
      }
    }
    return list;
  } else {
    return singleHours(CMD);
  }
  return {'ERROR': 'generic'};
}
/*
  getKills
  returns kill statistics as JSON
_________________________________________________________________*/
function getKills(input) {
  var fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    LOGGER.log('ERROR: Trying to send data to web client, but no data is available.',i);
    LOGGER.log('(Have you started recieving SLmod Stats data yet from any SLSC servers?)',i);
    LOGGER.log('Technical info: Either the DB "'+ DB + '.json" does not exist, or there is no ["server"] index within it',i);
    return false; //return empty object
  }
  return trimToServerList(json);
}
/*
  getDeaths
  returns death statistics as JSON
_________________________________________________________________*/
function getDeaths(input) {
  var fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    LOGGER.log('ERROR: Trying to send data to web client, but no data is available.',i);
    LOGGER.log('(Have you started recieving SLmod Stats data yet from any SLSC servers?)',i);
    LOGGER.log('Technical info: Either the DB "'+ DB + '.json" does not exist, or there is no ["server"] index within it',i);
    return false; //return empty object
  }
  return trimToServerList(json);
}
//--------------------------------
module.exports = {
  update: function(json) { return update(json) },
  getFullStats: function() { return getFullStats() },
  getServers: function() { return getServers() },
  getHours: function(input) { return getHours(input) },
  getKills: function(input) { return getKills(input) },
  getDeaths: function(input) { return getDeaths(input) }
};

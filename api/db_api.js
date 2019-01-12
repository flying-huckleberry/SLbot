/*

    api/db_api.js

    Functions and Helper Functions designed to
    Interact with the SLbot Database,
    return Results to API queries,
    return informative Error Messages

    By Huckleberry
______________________________________________________*/
const jsondb = require('node-json-db');
const fs = require('fs');

const CONFIG = require('../config.json');
const TYPES = require('../registry/types.json');
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

var airTypes = [];
var killTypes = [];
var cleanAirTypes = [];
var cleanKillTypes = [];

// function addDebugDB() {
//   var db = new jsondb(DB, true, true);
//   try { var caucas = db.getData('/server/caucas') }
//   catch(err) { return 'add debug db fail' }
//   db.push('/server/debug',caucas);
// }
// addDebugDB();

// function deleteDebugDB() {
//   var db = new jsondb(DB, true, true);
//   try { var server = db.getData('/server') }
//   catch(err) { return 'delete debug db fail' }
//   delete server['debug'];
//   db.push('/server',server);
// }
// deleteDebugDB();

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

//make types local, changeable registry profile
function makeTypes() {
  let fdb = new jsondb(DB, true, true);
  let types = false;
  try { types = fdb.getData('/type') }
  catch(err) {
    return LOGGER.log('makeTypes request for types, but no data is available.',i);
  }
  if (types['aircraft'] && types['kill']) {
    airTypes = types['aircraft'];
    killTypes = types['kill'];
    return false;
  } else {
    return LOGGER.log('makeTypes thinks aircraft or kill types is empty',i);
  }
}
makeTypes(); //do it now

/*
  cleanTypes
  sanitize TYPE arrays defined above
_________________________________________________________________*/
function cleanTypes() {
  for (var idx = 0; idx < airTypes.length; idx++) {
    cleanAirTypes[idx] = airTypes[idx]
                      .toLowerCase()
                      .replace(/[^\w]/gi, '');
  }
  for (var idx = 0; idx < killTypes.length; idx++) {
    cleanKillTypes[idx] = killTypes[idx]
                      .toLowerCase()
                      .replace(/[^\w]/gi, '');
  }
}
cleanTypes(); //do it now
/*
  updateTokens
  update tokens in the db with whats in the config
_________________________________________________________________*/
function updateTokens() {
  var db = new jsondb(DB, true, true);
  db.push('/token',TOKENS['SLSC']);
}
updateTokens(); //do it now


function poop() {
  LOGGER.log('poop',e)
  var db = new jsondb(DB, true, true);
  var thing = db.getData('/server/caucas');
  console.log(thing);
  var sv = new jsondb('api/db/poop', true, true);
  sv.push('/',thing);

}
poop();

/*
  updateAircraft
  updates a working list of aircraft available based on dataset
_________________________________________________________________*/
function updateAircraft() {
  var db = new jsondb(DB, true, true);
  try { var server = db.getData('/server') }
  catch(err) {
    LOGGER.log('ERROR: Trying to sync aircraft list, but no data is available.',e);
    return 'ERROR: NO Database '+DB+'/server'; //return the error
  }
  let newAc = [];
  //server,id,stats,number,times,aircraft
  Object.keys(server).forEach(function(serverId) { //for each server
    Object.keys(server[serverId]['stats']).forEach(function(playerId) { //for each player
      if (server[serverId]['stats'][playerId]['times']) {
        Object.keys(server[serverId]['stats'][playerId]['times']).forEach(function(aircraftId) { //for each module
          if (!airTypes.includes(aircraftId)) {
            LOGGER.log('Found new aircraft: '+aircraftId,e);
            newAc.push(aircraftId);
            airTypes.push(aircraftId); //push to local ac array
            db.push('/type/aircraft', airTypes); //push to db aircraft types
            db.push('/whitelist/aircraft/'+aircraftId, 1); //push to db aircraft whitelist
          }
        })
      }//if not null
    })
  });
  if (newAc.length == 0) {
    LOGGER.log('No new aircraft found');
  }
  return newAc;
}

/*
  sanitize
  remove uppercase and special chars
_________________________________________________________________*/
function sanitize(data) {
  return data.toLowerCase().replace(/[^\w\s\ ]/gi, '');
}
/*
  matchNames
  return all player id:name's that match the partial name
_________________________________________________________________*/
function matchNames(needle, haystack) {
  //find name
  let nameMatches = {};
  for (var k in haystack) {
    if (sanitize(haystack[k]['name'].replace(/[^\w]/gi, '')).includes(needle)) {
      //console.log(`found ${needle} in ${haystack[k]['name']}`);
      nameMatches[k] = haystack[k]['name'];
    }
  }
  return nameMatches;
}
/*
  matchAirTypes
  return all aircraft types that match the partial name
_________________________________________________________________*/
function matchAirTypes(needle) {
  //build list of types matching the partial typep
  let typeMatches = [];
  for (var k in cleanAirTypes) {
    if (cleanAirTypes[k].includes(needle)) {
      //console.log('found '+needle+' in '+cleanAircraftypes[k]);
      typeMatches.push(airTypes[k]);
    }
  }
  return typeMatches;
}
/*
  matchKillTypes
  update tokens in the db with whats in the config
_________________________________________________________________*/
function matchKillTypes(needle) {
  //build list of types matching the partial typep
  let typeMatches = [];
  for (var k in cleanKillTypes) {
    if (cleanKillTypes[k].includes(needle)) {
      //console.log('found '+needle+' in '+cleanKillTypes[k]);
      typeMatches.push(killTypes[k]);
    }
  }
  return typeMatches;
}
/*
  apiErr
  Log to logger and return an error message for SLbot & discord
_________________________________________________________________*/
function apiErr(mg, err = false) {
  //LOGGER.log(mg,i);
  if (err) { LOGGER.log(err,e) }
  return {'ERROR':mg };
}

function clearCache() {
  let db = new jsondb('./api/db/hash.json', true, true);
  try { var hash = db.getData('/hash') }
  catch(err) {
    return apiErr('API request for hash, but no data is available.', err);
  }
  db.push('/hash','');
  LOGGER.log('Cache cleared',i);

}
/*
  deTokenize
  remove the id and token before sending to client
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
  return (parseFloat(val)/3600).toFixed(2);
}
/*
  calcHours
  grab all the relevant times values and put them in the output
_________________________________________________________________*/
function calcHours(db, nameMatches, typeMatches) {
  let output = {};
  //set an output array with just name:{times}
  for (var spid in nameMatches) {
    if (db['stats'][spid]['times'] !== null) {
      output[ nameMatches[spid] ]={};
      for (var type in db['stats'][spid]['times']) {
        if (typeMatches.includes(type)) {
          output[nameMatches[spid]][type] = {
            'total': floatingPtHours(db['stats'][spid]['times'][type]['total']),
            'inAir': floatingPtHours(db['stats'][spid]['times'][type]['inAir'])
          };
        }
      }
      if (Object.keys(output[nameMatches[spid]]).length === 0) {
        delete output[ nameMatches[spid] ];
      }
    }
  }
  return output;
}
/*
  calcKills
  grab all the relevant kill values and put them in the output
_________________________________________________________________*/
function calcKills(db, nameMatches, typeMatches) {
  let output = {};
  //set an output array with just name:{times}
  for (var spid in nameMatches) {
    if (db['stats'][spid]['kills'] !== null) {
      output[ nameMatches[spid] ]={};
      for (var type in db['stats'][spid]['kills']) {
        if (typeMatches.includes(type)) {
          output[ nameMatches[spid] ][type] = db['stats'][spid]['kills'][type];
        }
      }
      if (Object.keys(output[nameMatches[spid]]).length === 0) {
        delete output[ nameMatches[spid] ];
      }
    }
  }
  return output;
}
/*
  calcDeaths
  grab all the relevant death values and put them in the output
_________________________________________________________________*/
function calcDeaths(db, nameMatches) {
  //losses and PvP => losses
  let output = {};
  let nal = Object.keys(nameMatches).length;
  //set an output array with just name:{times}
  for (var spid in nameMatches) {
    if (db['stats'][spid]['losses'] !== null) {
      output[nameMatches[spid]] = db['stats'][spid]['losses'];
      if (db['stats'][spid]['PvP']['losses'] !== null) {
        output[nameMatches[spid]]['PvP'] = db['stats'][spid]['PvP']['losses'];
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
            list[name][type]['inAir'] = (
              parseFloat(list[name][type]['inAir']) +
              parseFloat(aList[name][type]['inAir'])
            ).toFixed(2);
            list[name][type]['total'] = (
              parseFloat(list[name][type]['total']) +
              parseFloat(aList[name][type]['total'])
            ).toFixed(2);
          } else {
            //console.log('list['+name+'] doesnt have type '+type+', adding whole ['+type+']');
            list[name][type] = aList[name][type];
          }
        }
      }



    } //new user here not in og list, add if not empty
    else if (aList[name] != {}) { list[name] = aList[name] }
    //else {console.log('skipping empty set for '+name)}
  }
  return list;
}
/*
  addKills
  adds 1 kills array to another if the request is for all servers
_________________________________________________________________*/
function addKills(list, aList) {
  //console.log(list);
  //console.log(aList);
  for (var name in aList) {
    //console.log(' ? includes '+name);
    //same name in both lists, concat
    if (Object.keys(list).includes(name)) {
      //console.log('yes, has name '+name+', adding to ['+name+']');
      if (!aList[name] || aList[name] == {}) {
        //console.log('name not in aList, do nothing to '+list[name]);
      } else {
        //console.log('here');
        for (var type in aList[name]) {
          //same type, add fields together
          if (type in list[name]) {
            //console.log('same field in both concat, '+type);
            //console.log(name+' has type '+type+', adding to ['+name+']['+type+']');
            for (var kt in list[name][type]) {
              list[name][type][kt] = list[name][type][kt] +aList[name][type][kt];
            }

          //new type, add it as-is
          } else {
            //console.log('list['+name+'] doesnt have type '+type+', adding whole ['+type+']');
            list[name][type] = aList[name][type];
          }
        }
      }
    } //new user here not in og list, add if not empty
    else if (aList[name] != {}) { list[name] = aList[name] }
  }
  //console.log(list);
  return list;
}
/*
  addDeaths
  adds 1 deaths array to another if the request is for all servers
_________________________________________________________________*/
function addDeaths(list, aList) {
  for (var name in aList) {
    //console.log(' ? includes '+name);
    //same name in both lists, concat
    if (Object.keys(list).includes(name)) {
      //console.log('yes, has name '+name+', adding to ['+name+']');
      if (!aList[name] || aList[name] == {}) {
        //console.log('field empty, disregard this addition');
      } else {
        for (var type in aList[name]) {
          if (typeof aList[name][type] == 'object') {

            for (var idx in aList[name][type]) {
              if (!aList[name][type][idx] || aList[name][type][idx] == {}) {
                //console.log('field empty, disregard this addition');
              } else if (type in list[name]) {
                if (idx in list[name][type]) {
                  list[name][type][idx] += aList[name][type][idx];
                } else {
                  list[name][type][idx] = aList[name][type][idx];
                }
              }
            }
          } else {
            //console.log("adding "+list[name][type]+' to '+aList[name][type]);
            if (type in list[name]) {
              list[name][type] += aList[name][type];
            } else {
              list[name][type] = aList[name][type];
            }
          }
        }
      }
    } //new user here not in og list, add if not empty
    else if (aList[name] != {}) {
      list[name] = aList[name];
    }
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
    return apiErr('API request for hours data, but no data is available.', err);
  }
  server = CMD.args[2] || server; //we'd rather use server id defined in CMD
  if (server in serverdb) {
    let nameMatches = matchNames(CMD.args[0], serverdb[server]['stats']);
    //if no names matching that pattern
    if (Object.keys(nameMatches).length == 0) {
      return {};
    }
    let typeMatches = matchAirTypes(CMD.args[1]);
    if (Object.keys(typeMatches).length == 0) {
      return apiErr("Cannot find aircraft type matching `"+CMD.args[1]+'`');
    }
    //server, name, type are clean. lets do the thing!
    //send the server json, the whitelisted names and whitelisted types
    //---------------------------------------------
    return calcHours(serverdb[server], nameMatches, typeMatches);
    //---------------------------------------------
  } else {
    return apiErr("Server ID `"+(server||'undefined')+"` is invalid, should be one of these:\n{ `"+Object.keys(serverdb).join('`, `')+"` }");
  }
  return apiErr('generic hours api error');
}
/*
  singleKills
  returns a kills object for a single server
_________________________________________________________________*/
function singleKills(CMD, server = false) {
  let fdb = new jsondb(DB, true, true);
  try { var serverdb = fdb.getData('/server') }
  catch(err) {
    return apiErr('API request for kills data, but no data is available.',err);
  }
  server = CMD.args[2] || server; //we'd rather use server id defined in CMD
  if (server in serverdb) {
    let nameMatches = matchNames(CMD.args[0], serverdb[server]['stats']);
    //if no names matching that pattern
    if (Object.keys(nameMatches).length == 0) {
      return {}; //return only soft fail, so nothing will be added to a list
    }
    let typeMatches = matchKillTypes(CMD.args[1]);
    if (Object.keys(typeMatches).length == 0) {
      return apiErr("Cannot find object type matching `"+CMD.args[1]+"` in\n{ `"+cleanKillTypes.join('`, `')+"` }");
    }
    //server, name, type are clean. lets do the thing!
    //send the server json, the whitelisted names and whitelisted types
    //---------------------------------------------
    return calcKills(serverdb[server], nameMatches, typeMatches);
    //---------------------------------------------
  } else {
    return apiErr("Server ID `"+(server||'undefined')+"` is invalid, should be one of these:\n{ `"+Object.keys(serverdb).join('`, `')+"` }");
  }
  return apiErr('generic kills api error');
}
/*
  singleDeaths
  returns a deaths object for a single server
_________________________________________________________________*/
function singleDeaths(CMD, server = false) {
  let fdb = new jsondb(DB, true, true);
  try { var serverdb = fdb.getData('/server') }
  catch(err) {
    return apiErr('API request for deaths data, but no data is available.',err);
  }
  server = CMD.args[1] || server; //we'd rather use server id defined in CMD
  if (server in serverdb) {
    let nameMatches = matchNames(CMD.args[0], serverdb[server]['stats']);
    //if no names matching that pattern
    if (Object.keys(nameMatches).length == 0) {
      return {};
    }
    //server, name, type are clean. lets do the thing!
    //send the server json, the whitelisted names and whitelisted types
    //--------------------------------------------
    return calcDeaths(serverdb[server], nameMatches);
    //---------------------------------------------
  } else {
    return apiErr("Server ID `"+(server||'undefined')+"` is invalid, should be one of these:\n{ `"+Object.keys(serverdb).join('`, `')+"` }");
  }
  return apiErr('generic deaths api error');
}

//-------------------------------------
// API CALLS
//-------------------------------------

/*
  update
  updates the databases with new stats
_________________________________________________________________*/
function update(json) {
  console.log(json)
  var serverId = authorizeToken(json['id'], json['token']);
  if (serverId === false) { return 'Invalid Token, Aborting DB Update' }
  else { LOGGER.log('Token is valid for ID: ' + serverId, i) }
  //The second argument is used to tell the DB to save after each push
  //If you put false, you'll have to call the save() method.
  //The third argument is to ask JsonDB to save the database in an human readable format. (default false)
  var db = new jsondb(DB, true, true);
  var backupdb = new jsondb(BDB, true, true);
  try { var prevjson = db.getData('/') }
  catch(err) { return 'ERROR: Either the DB "'+ DB + '.json" does not exist, or there is no-thing "{}" within it' }
  backupdb.push('/', prevjson);
  LOGGER.log('Backup Database updates successfully',i);
  json = integerIncrementNameHashes(json); //TODO dont do this step
  json = setDisplayNames(json);
  db.push('/server/'+json['id'], json);
  LOGGER.log('Main Database updates successfully',i);
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

  //if not aircraft param
  if (!CMD.args[2]) {
    let list = {};
    let first = true;
    for (var serverKey in json) {
      //if first, define the first list
      if (first) {
        list = singleHours(CMD, serverKey);
        if (Object.keys(list).includes('ERROR')) {return list}
        //console.log('single hours, list =');
        //console.log(list);
        first = false;
      //if not first, add with first
      } else {
        let addingList = singleHours(CMD, serverKey);
        if (Object.keys(list).includes('ERROR')) {return list}
        list = addHours(list, addingList);
      }
    }
    return list;
  } else {
    return singleHours(CMD);
  }
  return {'ERROR': 'generic hours command error'};
}
/*
  getKills
  returns kill statistics as JSON
_________________________________________________________________*/
function getKills(CMD) {
  let fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    return LOGGER.log('API request for data, but no data is available.',i);
  }
  //console.log(`finding ${CMD.args[2]} recorded ${CMD.command} for ${CMD.args[0]} in type ${CMD.args[1]}`);

  //if not kill type param
  if (!CMD.args[2]) {
    let list = {};
    let first = true;
    for (var serverKey in json) {
      //if first, define the first list
      if (first) {
        list = singleKills(CMD, serverKey);
        if (Object.keys(list).includes('ERROR')) {return list}
        first = false;
      //if not first, add with first
      } else {
        let addingList = singleKills(CMD, serverKey);
        if (Object.keys(list).includes('ERROR')) {return list}
        list = addKills(list, addingList);
      }
    }
    return list;
  } else {
    return singleKills(CMD);
  }
  return {'ERROR': 'generic kills command error'};
}
/*
  getDeaths
  returns death statistics as JSON
_________________________________________________________________*/
function getDeaths(CMD) {
  let fdb = new jsondb(DB, true, true);
  try { var json = fdb.getData('/server') }
  catch(err) {
    return LOGGER.log('API request for data, but no data is available.',i);
  }
  //console.log(`finding ${CMD.args[2]} recorded ${CMD.command} for ${CMD.args[0]} in type ${CMD.args[1]}`);

  //if not server param
  if (!CMD.args[1]) {
    let list = {};
    let first = true;
    for (var serverKey in json) {
      //if first, define the first list
      if (first) {
        list = singleDeaths(CMD, serverKey);
        if (Object.keys(list).includes('ERROR')) {return list}
        first = false;
      //if not first, add with first
      } else {
        let addingList = singleDeaths(CMD, serverKey);
        if (Object.keys(list).includes('ERROR')) {return list}
        list = addDeaths(list, addingList);
      }
    }
    return list;
  } else {
    return singleDeaths(CMD);
  }
  return {'ERROR': 'generic deaths command error'};
}
/*
  getTypes
  returns types for building the web command form
_________________________________________________________________*/
function getTypes() {
  return {"aircraft" : airTypes, "kill": killTypes};
}
/*
  getWhitelist
  returns types for building the web command form
_________________________________________________________________*/
function getWhitelist() {
  var fdb = new jsondb(DB, true, true);
  try { var whitelist = fdb.getData('/whitelist') }
  catch(err) {
    LOGGER.log('ERROR: Trying to get whitelist, but no data is available.',e);
    return 'ERROR: NO Database '+DB+'/whitelist'; //return the error
  }
  return whitelist;
}
/*
  getDBSize
  returns types for building the web command form
_________________________________________________________________*/
function getDBSize() {
  const stats = fs.statSync(DB+'.json')
  return stats.size / 1000000.0 //filesize in mb
}

//--------------------------------
module.exports = {
  update: function(json) { return update(json) },
  getFullStats: function() { return getFullStats() },
  getServers: function() { return getServers() },
  getHours: function(input) { return getHours(input) },
  getKills: function(input) { return getKills(input) },
  getDeaths: function(input) { return getDeaths(input) },
  getTypes: function() { return getTypes() },
  getDBSize: function() { return getDBSize() },
  clearCache: function() { return clearCache() },
  updateAircraft: function() { return updateAircraft() }
};

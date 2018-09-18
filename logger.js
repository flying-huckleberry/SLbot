/*

    logger.js

    Log messages to the console,
    depending on log LOGLEVEL.
    return an Error Object
    in case Discord wants it

    By Huckleberry
______________________________________________________*/
const process = require('process');
const LOGLEVEL = process.argv[2] || '-d';

//global function for succinct logging ability
//only log what the process wanted us to log
function log(data, level) {
  switch (level) {
    case 'error': //log all errors
      console.log(data);
      break;
    case 'info': //only log info if verbose flag
      if (LOGLEVEL == '-v') {console.log(data)}
      break;
    case 'task': //log task-level log only if the silent flag is not set
      if (LOGLEVEL != '-s') {console.log(data)}
      break;
    default: //something is amiss, we better just log it
      console.log(data);
  }
  return {"ERROR": data};
}

module.exports = {
  log: function(data, level) {
     log(data,level)
  }
}

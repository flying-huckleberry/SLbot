/*

    logger.js

    Log messages to the console,
    and/or to a specified file
    depending on log LOGLEVEL.
    // return an Error Object
    //   in case Discord wants it

    By Huckleberry
______________________________________________________*/
const FS = require('fs');
const PROCESS = require('process');
const LOGLEVEL = PROCESS.argv[2] || '-d';

//global function for succinct logging ability
//only log what the process wanted us to log
function log(data, level) {
  let str = [getTimestamp(),data].join(' | ');
  switch (level) {
    case 'error': //log all errors
      console.log(str);
      break;
    case 'info': //only log info if verbose flag
      if (LOGLEVEL == '-v') {console.log(str)}
      break;
    case 'task': //log task only if the silent flag is not set
      if (LOGLEVEL != '-s') {console.log(str)}
      break;
    default: //something is amiss, we better just log it
      console.log(str);
  }
  FS.appendFile('LOG.txt', str+'\r\n', function (err) {
    if (err) {
      console.log('Unable to write to LOG.txt');
    }
  });
}

function getTimestamp() {
  let d = new Date;
  return [

    d.getFullYear(), (d.getMonth()+1).padLeft(),
    d.getDate().padLeft()
  ].join('/') +' ' +
  [
    d.getHours().padLeft(),
    d.getMinutes().padLeft(),
    d.getSeconds().padLeft()
  ].join(':');
}

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}

module.exports = {
  log: function(data, level) {
     log(data,level)
  }
}

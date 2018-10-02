/*

    logger.js

    Log messages to the Log Messages section
    of the app (through IPC)
    and append to the log file
    depending on log LOGLEVEL.
     - (default verbose w/ electron)

    By Huckleberry
______________________________________________________*/
const FS = require('fs')
//const PROCESS = require('process')
//const LOGLEVEL = PROCESS.argv[2] || '-d'
const LOGLEVEL = '-v' //default verbose w/ electron
const {ipcRenderer} = require('electron')

//global function for succinct logging ability
//only log what the process wanted us to log
function log(data, level) {
  let str = [getTimestamp(),data].join(' | ')
  switch (level) {
    case 'error': //log all errors
      ipcRenderer.send('log', str)
      break
    case 'info': //only log info if verbose flag
      if (LOGLEVEL == '-v') {
        ipcRenderer.send('log', str)
      }
      break
    case 'task': //log task only if the silent flag is not set
      if (LOGLEVEL != '-s') {
        ipcRenderer.send('log', str)
      }
      break
    default: //something is amiss, we better just log it
      ipcRenderer.send('log', str)
  }

  FS.appendFile('LOG.txt', str+'\r\n', function (err) {
    if (err) {
      let er = 'Unable to write to LOG.txt'
      console.log(er)
      ipcRenderer.send('log', er)
    }
  })
}

function getTimestamp() {
  let d = new Date
  return [

    d.getFullYear(), (d.getMonth()+1).padLeft(),
    d.getDate().padLeft()
  ].join('/') +' ' +
  [
    d.getHours().padLeft(),
    d.getMinutes().padLeft(),
    d.getSeconds().padLeft()
  ].join(':')
}

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1
    return len > 0? new Array(len).join(chr || '0')+this : this
}

module.exports = {
  log: function(data, level) {
     log(data,level)
  }
}

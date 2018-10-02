const Web = require('../../server.js')
const Bot = require('../../bot.js')
const {ipcRenderer} = require('electron')
window.$ = window.jQuery = require('jquery')

ipcRenderer.on('log', function(event , data) {
  let limit = 4196*2*2
  document.getElementById('log').innerHTML += (data+"<br/>")
  if (document.getElementById('log').innerHTML.length > limit) {
    document.getElementById('log').innerHTML =
      '... '+ document.getElementById('log').innerHTML.substr(
        document.getElementById('log').innerHTML.length-limit
      )
  }
  scrollLog()
})

ipcRenderer.on('alert' , function(event, data) {
  alert(data)
})

ipcRenderer.on('relay-update' , function(event, data) {
  Bot.announceUpdate(data)
})

function scrollLog() {
  //$('#log').animate({ scrollTop: $('#log').height() }, "slow")
  let element = document.getElementById("log")
  element.scrollTop = element.scrollHeight

}

$('#web-switch').on('click', function(e) {
  !document.getElementById("web-switch").checked? Web.turnOff() : Web.turnOn()
})

$('#bot-switch').on('click', function(e) {
  !document.getElementById("bot-switch").checked? Bot.turnOff() : Bot.turnOn()
})

$('#cron-switch').on('click', function(e) {
  console.log('cron switch')
  //!document.getElementById("cron-switch").checked? Cron.turnOff() : Cron.turnOn()
})

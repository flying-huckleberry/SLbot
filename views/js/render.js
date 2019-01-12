const Web = require('../../server.js')
const Bot = require('../../bot.js')
//const Cron = require('../../cron.js')

const {ipcRenderer} = require('electron')
window.$ = window.jQuery = require('jquery')

ipcRenderer.on('log', function(event , data) {
  let limit = 16784 // 4196*2*2
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
  updateWebConfig()
  !document.getElementById("web-switch").checked? Web.turnOff() : Web.turnOn()
})

$('#bot-switch').on('click', function(e) {
  //updateBotConfig()
  !document.getElementById("bot-switch").checked? Bot.turnOff() : Bot.turnOn()
})

$('#cron-switch').on('click', function(e) {
  //updateCronConfig()
  console.log('cron switch')
  //!document.getElementById("cron-switch").checked? Cron.turnOff() : Cron.turnOn()

  !document.getElementById("cron-switch").checked? hideSendBtn() : showSendBtn()
})

$('#clear-cache').on('click', function(e) {
  console.log('cache clear')
  Web.clearCache()
})

$('#send-now').on('click', function() {
  console.log('click')
})

$('#update-aircraft').on('click', function() {
  console.log('update')
  Web.updateAircraft()
})

function showSendBtn() {
  console.log("show")
  document.getElementById("send-stats").style.display ="block"
}

function hideSendBtn() {
  document.getElementById("send-stats").style.display = "none"
}
hideSendBtn()

function updateWebConfig() {
  var web = {
    "name": document.getElementById("name").value,
    "description": document.getElementById("description").value,
    "url": document.getElementById("url").value,
    "logo": document.getElementById("logo").value,
    "tag": document.getElementById("tag").value,
    "database": document.getElementById("database").value,
    "backupdatabase": document.getElementById("backupdatabase").value,
    "jsonsizelimit": document.getElementById("jsonsizelimit").value,
    "treeview": document.getElementById("treeview").value,
    "port": document.getElementById("port").value
  }
  var fs = require('fs')
  var config = '../../config.json'
  var file = require(config)
  file.web = web
  fs.writeFile(config, JSON.stringify(file), function (err) {
    if (err) return ipcRenderer.send('log', err)
    ipcRenderer.send('log', 'Web config saved')
    Web.refreshConfig()
    file = require('../../config.json')
    console.log(file.web.name)
  })

}

function updateBotConfig() {
  var bot = {
    "prefix": document.getElementById("prefix").value,
    "defaultchannel": document.getElementById("defaultchannel").value,
    "defaultonly": document.getElementById("defaultonly").value,
    "sendupdatemessages": document.getElementById("sendupdatemessages").value,
    "serverhealthindicator": document.getElementById("serverhealthindicator").value,
    "color": document.getElementById("color").value,
    "helpcolor": document.getElementById("helpcolor").value,
    "helpdescription": document.getElementById("helpdescription").value,
    "asimovfactor": document.getElementById("asimovfactor").value
  }


}

function updateCronConfig() {

}

function bakeConfig() {
  var config = require('../../config.json')
  document.getElementById('name').value = config.web.name
  document.getElementById('description').value = config.web.description
  document.getElementById('url').value = config.web.url
  document.getElementById('logo').value = config.web.logo
  document.getElementById('tag').value = config.web.tag
  document.getElementById('database').value = config.web.database
  document.getElementById('backupdatabase').value = config.web.backupdatabase
  document.getElementById('jsonsizelimit').value = config.web.jsonsizelimit
  document.getElementById('treeview').checked = config.web.treeview
  document.getElementById('port').value = config.web.port
}
bakeConfig()

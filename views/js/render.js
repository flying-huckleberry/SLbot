const Web = require('../../server.js');
const Bot = require('../../bot.js');

window.$ = window.jQuery = require('jquery');


const {ipcRenderer} = require('electron');

ipcRenderer.on('log', function(event , data) {
  let limit = 4196*2*2;
  //console.log(data);
  document.getElementById('log').innerHTML += (data+"<br/>");
  if (document.getElementById('log').innerHTML.length > limit) {
    document.getElementById('log').innerHTML =
      '... '+ document.getElementById('log').innerHTML.substr(
        document.getElementById('log').innerHTML.length-limit
      )
  }
  scrollLog();
});

ipcRenderer.on('about' , function(event, data) {
  //console.log(data);
  alert(data.msg);
});
function scrollLog(){
  //$('#log').animate({ scrollTop: $('#log').height() }, "slow");
  let element = document.getElementById("log");
  element.scrollTop = element.scrollHeight;

}

$('#web-switch').on('click', function(e) {
  !document.getElementById("web-switch").checked? Web.turnOff() : Web.turnOn();
});

$('#bot-switch').on('click', function(e) {
  !document.getElementById("bot-switch").checked? Bot.turnOff() : Bot.turnOn();
});
//
// $('#cron-switch').on('click', function(e) {
//   ipcRenderer.send('cron-state', document.getElementById("web-switch").checked);
// });

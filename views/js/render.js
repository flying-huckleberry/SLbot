//app js here
window.$ = window.jQuery = require('jquery');
//log shit to div

//handle clicks

//initiate lifecycle events

const {ipcRenderer} = require('electron');


ipcRenderer.on('log' , function(event , data) {
  let limit = 4196*2*2;
  //console.log(data);
  document.getElementById('log').innerHTML += (data.msg+"<br/>");
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
ipcRenderer.on('proc' , function(event, data) {
  console.log(data);
});
ipcRenderer.on('web-state' , function(event, state) {
  console.log(state);
  $('#web-switch').prop('checked', state);
});
ipcRenderer.on('bot-state' , function(event, data) {
  console.log(data);
});
ipcRenderer.on('cron-state' , function(event, data) {
  console.log(data);
});

$('#web-switch').on('click', function(e) {
  e.preventDefault();
  ipcRenderer.send('web-state', !document.getElementById("web-switch").checked);
});

// $('#bot-switch').on('click', function(e) {
//   ipcRenderer.send('bot-state', document.getElementById("web-switch").checked);
// });
//
// $('#cron-switch').on('click', function(e) {
//   ipcRenderer.send('cron-state', document.getElementById("web-switch").checked);
// });
function scrollLog(){
  //$('#log').animate({ scrollTop: $('#log').height() }, "slow");
  let element = document.getElementById("log");
  element.scrollTop = element.scrollHeight;

}

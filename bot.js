/*

    bot.js

    Serves SLbot to your Discord
    SLbot can send update messages to discord
    SLbot can interpret a few commands from discord
    SLbot can be extended with new commands

    By Huckleberry
______________________________________________________*/
const DISCORD = require('discord.js');
const CLIENT = new DISCORD.Client();
//----------------------------------
const LOGGER = require('./logger.js');
const API = require('./api/db_api.js');
const APICOMMANDS = require('./api-commands.json');
const CONFIG = require('./config.json');
const TOKENS = require('./tokens.json');
var WEBHOOKS = {};
for (let key in TOKENS.webhooks) {
  WEBHOOKS[key] = new DISCORD.WebhookClient(TOKENS.webhooks[key]['token']);
}

//vars for easy logging
const e = 'error';
const i = 'info';
const t = 'task';

//bot is logged into discord
CLIENT.on('ready', () => {
  LOGGER.log(`SLbot App logged into Discord as ${CLIENT.user.tag}`,t);
});

//message is sent on a visible channel
CLIENT.on('message', msg => {
  if (msg.author.bot) return;
  if (msg.channel.type === "dm") return;
  //CHECK IF COMMAND
  //if the first character is a command prefix, parse the command + args out
  if (msg.content.charAt(0) === CONFIG.bot.prefix) {

    //-------------------------------------
    // COMMANDS
    //-------------------------------------
    const CMD = sanitizeCmd(msg.content);

    /*
      API COMMANDS
      servers, stats, commands, help, hours, kills, deaths
    _________________________________________________________________*/
    //if the current command is in the commands list above
    if (Object.keys(APICOMMANDS).includes(CMD.command)) {
      sendToChannel(msg, createAPIEmbed(CMD), msg.content);
    }
    /*
      !hook
    _________________________________________________________________*/
    if (CMD.command === 'hook') {
      for (var i in WEBHOOKS) {
        WEBHOOKS[i].send('229th Bot sends its regards.')
          .then(message => LOGGER.log(msg.content, i))
          .catch(console.error);
      }
    }
    /*
      !doabarrelroll
    _________________________________________________________________*/
    if (CMD.command === 'doabarrelroll') {
      //sendToChannel(msg, '*barrel rolls*', '*barrel rolls*');
      msg.channel.send('*barrel rolls*')
        .then(message => LOGGER.log(msg.content))
        .catch(console.error);
        //msg.reply('*barrel rolls*')
    }
    /*
      !redtails
      returns RichEmbed GIF
    _________________________________________________________________*/
    if (CMD.command === 'redtails') {
      const embed = new DISCORD.RichEmbed()
        .setTitle('Red Tails Maneuver')
        .setColor(0xCF0000)
        .setDescription('I flit, I float, I fleetly flee, I fly')
        .setImage('https://thumbs.gfycat.com/FlippantUniformAustraliankestrel-small.gif');
      sendToChannel(msg, embed, msg.content);
    }

    // /*
    //   mycommand
    //   returns RichEmbed , add your own commands
    //   https://discord.js.org/#/docs/main/stable/class/RichEmbed
    // _________________________________________________________________*/
    // if (CMD.command === 'mycommand') {
    //
    //   //configure the embed
    //   const embed = new DISCORD.RichEmbed()
    //     .setTitle('New Command')
    //     .setColor(0xCF0000)
    //     .setDescription('More commands coming soon...');
    //
    //   //send it to the discord channel
    //   sendToChannel(msg, embed, msg.content);
    // }
  }
});


//-------------------
// HELPERS
//-------------------

/*
  sanitizeCmd
  sanitizes and formats the raw string command from the user
_________________________________________________________________*/
function sanitizeCmd(input) {
  input = input.split(' ');
  //sanitize the array
  for (var i in input) {
    input[i] = input[i].toLowerCase().replace(/[^\w\s]/gi, '');
  }
  return {
    'command': input[0],
    'args': input.slice(1) //array slice the command off the args list
  };
}
/*
  createAPIEmbed
  returns RichEmbed based on the CMD API call
_________________________________________________________________*/
function createAPIEmbed(CMD) {
  //if help command
  if (CMD.args[0] == 'help') {
    return helpCommandEmbed(CMD);
  //if not help command
  } else {
    //if its stats
    if (CMD.command == 'stats') {
      return statsCommandEmbed(CMD);
      //servers command
    } else if (CMD.command == 'servers') {
      return serversCommandEmbed(CMD);
    //help, commands command
    } else if (CMD.command == 'help'
      || CMD.command == 'commands'
    ) {
      return commandsCommandEmbed(CMD);
    //hours, kills, deaths command
    } else if (
      CMD.command == 'hours'
      || CMD.command == 'kills'
      || CMD.command == 'deaths'
    ) {
      //not enough args
      if (!CMD.args[0] || !CMD.args[1]) { return helpCommandEmbed(CMD).addField('ERROR','Not Enough Arguments') }
      //enough args
      else { return hkdCommandEmbed(CMD) }
    }

    //custom commands

    // else if (CMD.command == 'custom') {
    //   return customCommand1(CMD);
    // }

    // else if (CMD.command == 'custom2') {
    //   return customCommand2(CMD);
    // }

    // else if (CMD.command == 'custom3') {
    //   return customCommand3(CMD);
    // }


    //unknown command
    else {
      return unknownCommandEmbed(CMD);
    }
  }
}
/*
  commandsCommandEmbed
  returns RichEmbed with all commands listed as help
_________________________________________________________________*/
function commandsCommandEmbed(CMD) {
  let embed = new DISCORD.RichEmbed()
    .setTitle('SLbot Help')
    .setColor(CONFIG.bot.helpcolor)
    .setDescription(CONFIG.bot.helpdescription)
    .setThumbnail(CONFIG.web.url+'assets/'+CONFIG.web.logo)
    .setFooter(CONFIG.web.url);
  let ct = 1;
  for (var i in APICOMMANDS) {
    embed.addField('\u200C','-----------------------------------------------------'); //zero width non-joiner
    for (var k in APICOMMANDS[i]) {
      embed.addField(k,APICOMMANDS[i][k]);
    }
  }
  return embed;
}
/*
  helpCommandEmbed
  returns RichEmbed for 1 command as help
_________________________________________________________________*/
function helpCommandEmbed(CMD) {
  let embed = new DISCORD.RichEmbed()
    .setColor(CONFIG.bot.helpcolor)
    .setThumbnail(CONFIG.web.url+'assets/'+CONFIG.web.logo)
    .setFooter(CONFIG.web.url);
  for (var k in APICOMMANDS[CMD.command]) {
    embed.addField(k,APICOMMANDS[CMD.command][k]);
  }
  return embed;
}
/*
  statsCommandEmbed
  returns RichEmbed as link to the web server
_________________________________________________________________*/
function statsCommandEmbed(CMD) {
  let embed = new DISCORD.RichEmbed()
    .setTitle(CONFIG.web.name)
    .setColor(CONFIG.bot.color)
    .setDescription(CONFIG.web.description)
    .setThumbnail(CONFIG.web.url+'assets/'+CONFIG.web.logo)
    .setURL(CONFIG.web.url)
    .setFooter(CONFIG.web.url);
  return embed;
}
/*
  serversCommandEmbed
  returns RichEmbed as list of connected SLmod servers
_________________________________________________________________*/
function serversCommandEmbed(CMD) {
  let embed = new DISCORD.RichEmbed()
    .setTitle(`Server List for ${CONFIG.web.name}`)
    .setColor(CONFIG.bot.color)
    .setDescription(discordStringifyObject(API.getServers())) //TODO API call
    .setThumbnail(CONFIG.web.url+'assets/'+CONFIG.web.logo)
    .setFooter(CONFIG.web.url);
  return embed;
}
/*
  hkdCommandEmbed
  returns RichEmbed of the Hours, Kills, Deaths commands as STATS
_________________________________________________________________*/
function hkdCommandEmbed(CMD) {
  let fields = false;
  switch (CMD.command) {
    case 'hours':
      fields = API.getHours(CMD);
      break;
    case 'kills':
      fields = API.getKills(CMD);
      break;
    case 'deaths':
      fields = API.getDeaths(CMD);
      break;
    default:
      fields = {'ERROR': 'command `'+CMD.command+'` is not in { `hours`, `kills`, `deaths` }'};
  }
  let discordStr = discordStringifyObject(fields);
  //immutable values for embed
  let embed = new DISCORD.RichEmbed()
    .setTitle(`${CMD.command.toUpperCase()} Statistic Reporter`)
    .setDescription(`${CMD.args[0]}'s ${CMD.args[2]||'total'} ${CMD.command} in ${CMD.args[1]}`)
    .setThumbnail(CONFIG.web.url+'assets/'+CONFIG.web.logo)
    .setFooter(CONFIG.web.url)
    .addField( //capitalize first letter of CMD.command
      CMD.command.slice(0,1).toUpperCase()+CMD.command.slice(1),
      discordStr
    );
  if (discordStr.length >= 1024) {
    embed.addField('Alert',"Output is too long for Discord.\nUse more specific argument values,\nor type `!stats` to link the web view.");
  }
  if (fields.hasOwnProperty('ERROR')) {
    console.log('SLbot embed has API error: '+fields['ERROR']);
    embed.setColor(CONFIG.bot.helpcolor);
  } else {
    embed.setColor(CONFIG.bot.color);
  }
  return embed;
}
/*
  unknownCommandEmbed
  returns RichEmbed error, command is not properly configured
_________________________________________________________________*/
function unknownCommandEmbed(CMD) {
  const embed = new DISCORD.RichEmbed()
    .setTitle('SLbot Help')
    .setColor(CONFIG.bot.helpcolor)
    .setDescription('Unknown Command: `'+CMD.command+'`')
    .setThumbnail(CONFIG.web.url+'assets/'+CONFIG.web.logo)
    .setFooter(CONFIG.web.url);
  return embed;
}
/*
  discordStringifyObject
  returns certain types of objects as a string
  formatted specifically for discord
_________________________________________________________________*/
function discordStringifyObject(input) {
  var output = "";
  for (var first in input) {
    if (typeof input[first] == 'object') {
      output += "**"+first + "**:\n";
      for (var second in input[first]) {
        output += "--- "+second+":\n";
        for (var third in input[first][second]) {
          if (typeof input[first][second][third] == 'object') {
            output += ". . . . . "+third+":\n";
            for (var fourth in input[first][second][third]) {
              output += ". . . . . . . "+fourth+": **"+input[first][second][third][fourth]+"**\n";
            }
          } else {
            output += ". . . . . "+third+": **"+input[first][second][third]+"**\n";
          }
        }
      }
    //after first level is not an object
    }  else {
      output += "`"+first+"`: "+input[first]+"\n";
    }
  }
  if (output.length > 1024) {
    output = output.substring(0,1020) + " ...";
  }
  return output;
}
/*
  sendToChannel
  sends off a message to the channel that sent the request
_________________________________________________________________*/
function sendToChannel(msg, embed, log) {
  msg.channel.send(embed)
    .then(message => LOGGER.log(log, i))
    .catch(console.error);
}

//make the bot come online in discord
CLIENT.login(TOKENS.discord.token);

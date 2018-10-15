/*

    bot.js

    Serves SLbot to your Discord
    SLbot can send update messages to discord
    SLbot can interpret a few commands from discord
    SLbot can be extended with new commands

    By Huckleberry
______________________________________________________*/
const Discord = require('discord.js')
const Bot = new Discord.Client()
const Cooldowns = new Discord.Collection()
const Logger = require('./logger.js')
const API = require('./api/db_api.js')
const APICommands = require('./registry/api-commands.json')
const Config = require('./config.json')
const Tokens = require('./tokens.json')
// var WEBHOOKS = {}
// for (let key in Tokens.webhooks) {
//   WEBHOOKS[key] = new Discord.WebhookClient(Tokens.webhooks[key]['token'])
// }

//vars for easy logging
const e = 'error'
const i = 'info'
const t = 'task'

var lastUpdate = new Date()

//bot is logged into discord
Bot.on('ready', () => {
  Bot.user.setStatus('online')
  Bot.user.setActivity(
    (Math.floor(Math.random() * Config.bot.asimovfactor) != 0)
      ? 'SLbot'
      : 'KILL ALL HUMANS'
  )
  if (Config.bot.serverhealthindicator) { startHealthInterval() }
})

//message is sent on a visible channel
Bot.on('message', msg => {
  if (msg.author.bot) return
  if (msg.channel.type === "dm") return
  if (Config.bot.defaultonly
        && msg.channel.name != Config.bot.defaultchannel) return

  //CHECK IF COMMAND
  //if the first character is a command prefix, parse the command + args out
  if (msg.content.charAt(0) === Config.bot.prefix) {

    //-------------------------------------
    // COMMANDS
    //-------------------------------------
    const CMD = sanitizeCmd(msg.content)

    if (!Cooldowns.has(CMD.command)) {
      Cooldowns.set(CMD.command, new Discord.Collection())
    }
    const timestamps = Cooldowns.get(CMD.command)
    const cooldownAmount = 4000 //4 seconds
    const now = Date.now()
    //timestamps is clear of this author, but not anymore!
    if (!timestamps.has(msg.author.id)) {
        //console.log('adding '+msg.author.id+' to timestamps')
        //add it to timestamps
        timestamps.set(msg.author.id, now)
        //remove it from list after a few seconds
        setTimeout(() => function() {
          //console.log('removing '+msg.author.id+' from timestamps')
          timestamps.delete(msg.author.id)
        }, cooldownAmount)
    }
    else {
      const expirationTime = timestamps.get(msg.author.id) + cooldownAmount
      if (now < expirationTime) {
          return msg.reply(`please wait ${((expirationTime - now) / 1000).toFixed(1)} more second(s) before reusing the \`${CMD.command}\` command.`)
      }
      timestamps.set(msg.author.id, now)
      setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount)
    }

    /*
      API COMMANDS
      hours, kills, deaths, servers, stats, commands, help
    _________________________________________________________________*/
    //if the current command is in the commands list above
    if (Object.keys(APICommands).includes(CMD.command)) {
      sendCommandReply(
        msg,
        createAPIEmbed(CMD),
        commandInfo(msg))
    }
    /*
      !doabarrelroll
    _________________________________________________________________*/
    if (CMD.command === 'doabarrelroll') {
      //sendCommandReply(msg, '*barrel rolls*', '*barrel rolls*')
      msg.channel.send('*barrel rolls*')
        .then(message => Logger.log(commandInfo(msg), i))
        .catch(console.error)
        //msg.reply('*barrel rolls*')
    }
    /*
      !redtails
      returns RichEmbed GIF
    _________________________________________________________________*/
    if (CMD.command === 'redtails') {
      const embed = new Discord.RichEmbed()
        .setTitle('Red Tails Maneuver')
        .setColor(0xCF0000)
        .setDescription('I flit, I float, I fleetly flee, I fly')
        .setImage('https://thumbs.gfycat.com/FlippantUniformAustraliankestrel-small.gif')
      sendCommandReply(msg, embed, commandInfo(msg))
    }

    /*
      mycommand
      returns RichEmbed , add your own commands
      https://discord.js.org/#/docs/main/stable/class/RichEmbed
    _________________________________________________________________*/
    if (CMD.command === 'pic') {
      let user = msg.mentions.users.first()
      let embed
      if (!user) {
        embed = new Discord.RichEmbed()
          .setTitle('ERROR')
          .setColor(Config.bot.helpcolor)
          .setDescription("Syntax: `"+Config.bot.prefix+"pic` `<@username>`")
      } else {
        //configure the embed
        embed = new Discord.RichEmbed()
        .setColor(Config.bot.color)
        .setAuthor(user.username,user.avatarURL)
        .setTitle('Open original')
        .setURL(user.avatarURL)
        .setImage(user.avatarURL)
      }
      //send it to the discord channel
      sendCommandReply(msg, embed, commandInfo(msg))
    }

    /*
      mycommand
      returns RichEmbed , add your own commands
      https://discord.js.org/#/docs/main/stable/class/RichEmbed
    _________________________________________________________________*/
    if (CMD.command === 'serverpic') {
      let embed = new Discord.RichEmbed()
          .setColor(Config.bot.color)
          .setAuthor(msg.guild.name, msg.guild.iconURL)
          .setTitle('Open original')
          .setURL(msg.guild.iconURL)
          .setImage(msg.guild.iconURL)
          .setFooter(Config.web.url)
      //send it to the discord channel
      sendCommandReply(msg, embed, commandInfo(msg))
    }

    // /*
    //   mycommand
    //   returns RichEmbed , add your own commands
    //   https://discord.js.org/#/docs/main/stable/class/RichEmbed
    // _________________________________________________________________*/
    // if (CMD.command === 'mycommand') {
    //
    //   //configure the embed
    //   const embed = new Discord.RichEmbed()
    //     .setTitle('New Command')
    //     .setColor(0xCF0000)
    //     .setDescription('More commands coming soon...')
    //
    //   //send it to the discord channel
    //   sendCommandReply(msg, embed, msg.content)
    // }
  }
})

//-------------------
// HELPERS
//-------------------
/*
  hkdAPI
  call the API hours/kills/deaths function depending on command
_________________________________________________________________*/
function hkdAPI(CMD) {
  let fields = false
  switch (CMD.command) {
    case 'hours':
      fields = API.getHours(CMD)
      break
    case 'kills':
      fields = API.getKills(CMD)
      break
    case 'deaths':
      fields = API.getDeaths(CMD)
      break
    default:
      fields = {'ERROR': 'command `'+CMD.command+'` is not in { `hours`, `kills`, `deaths` }'}
  }
  return fields
}
/*
  sanitizeCmd
  sanitizes and formats the raw string command from the user
_________________________________________________________________*/
function sanitizeCmd(input) {
  input = input.split(/\s+/)
  //sanitize the array
  for (var i in input) {
    input[i] = input[i].toLowerCase().replace(/[^\w]/gi, '')
  }
  return {
    'command': input[0],
    'args': input.slice(1) //array slice the command off the args list
  }
}
/*
  createAPIEmbed
  returns RichEmbed based on the CMD API call
_________________________________________________________________*/
function createAPIEmbed(CMD) {
  //if help command
  if (CMD.args[0] == 'help') {
    return helpCommandEmbed(CMD)
  //if not help command
  } else {
    //if its stats
    if (CMD.command == 'stats') {
      return statsCommandEmbed(CMD)
      //servers command
    } else if (CMD.command == 'servers') {
      return serversCommandEmbed(CMD)
    //help, commands command
    } else if (CMD.command == 'help'
      || CMD.command == 'commands'
    ) {
      return commandsCommandEmbed(CMD)
    //hours, kills, deaths command
    } else if (
      CMD.command == 'hours'
      || CMD.command == 'kills'
      || CMD.command == 'deaths'
    ) {
      //not enough args
      if (!CMD.args[0] || (CMD.command != 'deaths' && !CMD.args[1])) {
        return helpCommandEmbed(CMD)
                .addField('ERROR','Not Enough Arguments')
      }
      //enough args
      else { return hkdCommandEmbed(CMD) }
    }

    //custom commands

    // else if (CMD.command == 'custom') {
    //   return customCommand1(CMD)
    // }

    // else if (CMD.command == 'custom2') {
    //   return customCommand2(CMD)
    // }

    // else if (CMD.command == 'custom3') {
    //   return customCommand3(CMD)
    // }


    //unknown command
    else {
      return unknownCommandEmbed(CMD)
    }
  }
}
/*
  commandsCommandEmbed
  returns RichEmbed with all commands listed as help
_________________________________________________________________*/
function commandsCommandEmbed(CMD) {
  let embed = new Discord.RichEmbed()
    .setTitle('SLbot Help')
    .setColor(Config.bot.helpcolor)
    .setDescription(Config.bot.helpdescription)
    .setThumbnail(Config.web.logo)
    .setFooter(Config.web.url+'/command')
  let ct = 1
  for (var i in APICommands) {
    embed.addField('\u200C','-----------------------------------------------------') //zero width non-joiner
    for (var k in APICommands[i]) {
      embed.addField(k,APICommands[i][k])
    }
  }
  return embed
}
/*
  helpCommandEmbed
  returns RichEmbed for 1 command as help
_________________________________________________________________*/
function helpCommandEmbed(CMD) {
  let embed = new Discord.RichEmbed()
    .setTitle('Commands Helper')
    .setURL((Config.web.url+'/command'))
    .setColor(Config.bot.helpcolor)
    .setThumbnail(Config.web.logo)
    .setFooter(Config.web.url)
  for (var k in APICommands[CMD.command]) {
    embed.addField(k,APICommands[CMD.command][k])
  }
  return embed
}
/*
  statsCommandEmbed
  returns RichEmbed as link to the web server
_________________________________________________________________*/
function statsCommandEmbed(CMD) {
  let embed = new Discord.RichEmbed()
    .setTitle(Config.web.name)
    .setColor(Config.bot.color)
    .setDescription(Config.web.description)
    .setThumbnail(Config.web.logo)
    .setURL(Config.web.url)
    .setFooter(Config.web.url)
  return embed
}
/*
  serversCommandEmbed
  returns RichEmbed as list of connected SLmod servers
_________________________________________________________________*/
function serversCommandEmbed(CMD) {
  let embed = new Discord.RichEmbed()
    .setTitle(`Server List for ${Config.web.name}`)
    .setColor(Config.bot.color)
    .setDescription(discordStringifyObject(API.getServers())) //TODO API call
    .setThumbnail(Config.web.logo)
    .setFooter(Config.web.url)
  return embed
}
/*
  hkdCommandEmbed
  returns RichEmbed of the Hours, Kills, Deaths commands as STATS
_________________________________________________________________*/
function hkdCommandEmbed(CMD) {
  //API call
  let fields = hkdAPI(CMD)
  if (!fields) {
    return helpCommandEmbed(CMD)
            .addField('ERROR', 'Command must be `hours`, `kills`, or `deaths`')
  }
  let discordStr = discordStringifyObject(fields)
  //Logger.log(JSON.stringify(fields, null, 4),i)
  //immutable values for embed
  let embed = new Discord.RichEmbed()
    .setTitle(`${CMD.command.toUpperCase()} Statistic Reporter`)
    .setDescription(`${CMD.args[0]}'s ${CMD.args[2]||'total'} ${CMD.command} in ${CMD.args[1]||'server'}`)
    .setThumbnail(Config.web.logo)
    .setFooter(Config.web.url)
    .addField( //capitalize first letter of CMD.command
      CMD.command.slice(0,1).toUpperCase()+CMD.command.slice(1),
      discordStr
    )
  if (discordStr.length >= 1024) {
    embed.addField('Alert',"Output is too long for Discord.\nUse more specific argument values,\nor type `!stats` to link the web view.")
  }
  if (fields.hasOwnProperty('ERROR')) {
    Logger.log('SLbot embed has API error: '+fields['ERROR'], i)
    embed.setColor(Config.bot.helpcolor)
  } else {
    embed.setColor(Config.bot.color)
  }
  return embed
}
/*
  unknownCommandEmbed
  returns RichEmbed error, command is not properly configured
_________________________________________________________________*/
function unknownCommandEmbed(CMD) {
  const embed = new Discord.RichEmbed()
    .setTitle('SLbot Help')
    .setColor(Config.bot.helpcolor)
    .setDescription('Unknown Command: `'+CMD.command+'`')
    .setThumbnail(Config.web.logo)
    .setFooter(Config.web.url)
  return embed
}
/*
  discordStringifyObject (recursive)
  returns objects as a string formatted for discord
_________________________________________________________________*/
function discordStringifyObject(input, output = "", level = 0) {
  if (level == 0 && Object.keys(input).includes('ERROR')) {
    return '**ERROR**: '+input['ERROR']+'\n'
  } else if (Object.keys(input).length === 0) {
    return "NULL\n"
  }
  for (var key in input) {
    if (typeof input[key] == 'object') {
      if (level == 0) {
        output += "**"+key+"**:\n"
      } else {
        output += "--- "+key+":\n"
      }
      output = discordStringifyObject(input[key], output, level+1)
    //not an object, so this is a string or number
    } else {
      //level 0 recursion (servers)
      if (level == 0) {
        output += "`"+key+"`: "+input[key]+"\n"
      //if level 1 recursion (deaths)
      } else if (level == 1) {
        output += ". . . "+key+": **"+input[key]+"**\n"
      //if level 2 recursion (hours & kills)
      } else {
        output += ". . . . . "+key+": **"+input[key]+"**\n"
      }
    }
  }
  if (output.length > 1024) {
    output = output.substring(0,1020) + " ..."
  }
  return output
}
/*
  startHealthInterval
  makes the bot user color green, yellow, or red
  based on how long ago it received a server update
_________________________________________________________________*/
function startHealthInterval() {
  Bot.setInterval(function() {
    let hoursSinceUpdate = ((new Date()-lastUpdate)/3600000)
    //console.log('hoursSince='+hoursSinceUpdate)
    //Logger.log('uptime '+(Bot.uptime/60000).toFixed(2)+' mins',i)
    if (Bot.user.presence.status !== 'online'
        && hoursSinceUpdate <= 24) {
      //Logger.log('setting online',i)
      Bot.user.setStatus('online')
    //30 min since last run, status not idle
    } else if (Bot.user.presence.status !== 'idle'
        && hoursSinceUpdate > 24 && hoursSinceUpdate <= 48) {
      //Logger.log('setting idle',i)
      Bot.user.setStatus('idle')
    //1 hour since last run, status not dnd
    } else if (Bot.user.presence.status != 'dnd'
        && hoursSinceUpdate > 48) {
      //Logger.log('setting dnd',i)
      Bot.user.setStatus('dnd')
    //fringe case, bring things back into normity
    } else if (!['dnd','idle','online'].includes(Bot.user.presence.status)) {
      //Logger.log('setting online',i)
      Bot.user.setStatus('online')
    }
  //run every hour
  }, 3600000)
  //run every 30 seconds
  //}, 30000)
}
/*
  sendCommandReply
  sends off a message to the channel that sent the request
_________________________________________________________________*/
function sendCommandReply(msg, embed, log) {
  msg.channel.send(embed)
    .then(message => Logger.log(log, i))
    .catch(console.error)
}
/*
  sendToChannel
  sends a message/embed to a specific channel ID
_________________________________________________________________*/
function sendToChannel(cid, embed, log) {
  Bot.channels.get(cid).send(embed)
    .then(message => Logger.log(log, i))
    .catch(console.error)
}
/*
  getDiscordList
  returns an array of the connected Discords (guild names)
_________________________________________________________________*/
function getDiscordList() {
  let list = []
  for (let guild of Bot.guilds.values()) {
    list.push(guild.name)
  }
  return list
}
/*
  commandInfo
  returns a string formatted for the log about the command info
_________________________________________________________________*/
function commandInfo(msg) {
  return msg.author.username+' sends command "'+msg.content+'" to '+msg.guild.name+' channel #'+msg.channel.name
}
/*
  announceUpdate
  when a node sends a stats update, send to the appr. channels
_________________________________________________________________*/
function announceUpdate(name) {
  let embed = new Discord.RichEmbed()
    .setTitle('Database Refreshed')
    .setColor(Config.bot.color)
    .setDescription('New update from '+name)
    .setThumbnail(Config.web.logo)
    .setFooter(Config.web.url)
  for (var guild of Bot.guilds.values()) {
    for (var channel of guild.channels.values()) {
      if (channel.name == Config.bot.defaultchannel) {
        sendToChannel(channel.id, embed,
          'SLbot announces in '+guild.name+' channel #'+channel.name+' of an update from '+name)
      }
    }
  }
  lastUpdate = new Date()
}


function turnOn() {
  //make the bot come online in discord
  Logger.log('Bot Server starting...', i)
  Bot.login(Tokens.discord.token).then(function() {
    Logger.log(`${Bot.user.tag} AWAKE on Discord`, t)
    Logger.log('Guilds: '+getDiscordList().join(', '), i)
  })
}

function turnOff() {
  Logger.log('Bot Server stopping...', i)
  Bot.destroy().then(function() {
    Logger.log('Bot Server STOPPED', t)
  })
}

function refreshConfig() {
  Config = require('../../config.json')
}

module.exports = {
  isOn:           function() { return Bot? true : false },
  turnOn:         function() { turnOn() },
  turnOff:        function() { turnOff() },
  announceUpdate: function(name) { return announceUpdate(name) },
  refreshConfig: function() { refreshConfig() }
}

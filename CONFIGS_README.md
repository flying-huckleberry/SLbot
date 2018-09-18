CONFIG README

This will take you through each value in the configs to explain what it means, and how to use it.
Be sure to leave off the comma at the end of every list, or the file will become invalid JSON.

-----------------------
tokens.json
-----------------------

This is a list of ID: Token pairs, which identify the different SLender servers tracking to your SLbot server.

The ID field cannot contain spaces.  You assign these values to whatever you want, based on the DCS servers which will send you its SLmod data.

Make sure the tokens are secure, and the server IDs are simple and easy enough to type (Discord users will have to reference this server ID in their S3bot commands)

-----------------------
config.json
-----------------------

NAME:

What do you want to call your Web Server?
Can have spaces and special characters

LOGO:

The file name of the image that you store in /views/assets

TAG:

What pattern do you want to search for, to try to find a default player name?
By default, this will find '229) ' in '(A/229) Huckleberry [H]', and set that as their default player name.
Otherwise, it will be the last name in their list of names.
If you don't want to use it, make it something really obscure like '%#^$(*HHHJKV*())'.

TREEVIEW:

Do you want to enable the button to show the stats in Tree View? (true/false)
This is resource intensive, and freezes some browsers while the tree is generated.

JSONSIZELIMIT:

This is a string input, which should be a number followed by mb, ex. '20mb'.
This needs to be sufficiently large to fit a growing SLmod dataset.

PORT:

Do you need to run the server on a specific port?
Perhaps you can only forward a certain range of ports through your firewall.
Or maybe you have another server listening on local 4000.
Otherwise, leave it at default and forward port 4000 in your router/firewall.

DATABASE:

The name of the JSON database that will be stored in /api/db
Alphanumeric only, dont get crazy with the name

BACKUPDATABASE:

The name of the backup JSON database that will be stored in /api/db
Alphanumeric only, dont get crazy with the name

-----------------------
bot-config.json
-----------------------

TOKEN:

Taken from https://discordapp.com/developers/applications when you create an app,
This value is private and should only be used here, in bot-config.json.

PREFIX:

This is the single character at the beginning of the discord command, which will tell SLbot that it should treat the message as a command.
Usually it is an exclamation "!" or a question "?" mark, but can be whatever you want, so long as it is only 1 character.

COLOR:

The SLbot will send messages in the discord with different colors.
This string should be in hexadecimal format, "0x" followed by your 6-digit hex value,
i.e. anywhere between "0x000000" & "0xFFFFFF".

HELPCOLOR:

Similarly to COLOR, HELPCOLOR determines the color of SLbot help and error messages.

WEBHOOKS:

If you have defined webhooks and want to give discord access to them, name them & plug them in here.

-----------------------
bot-commands.json
-----------------------
The syntax for the bot commands...
You probably don't want to edit this unless you really like to customize things.

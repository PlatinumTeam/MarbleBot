var Discord = require("discord.io");
var bot = new Discord.Client({
	token: process.argv[2],
	autorun: true
});

bot.on('ready', function() {
	console.log('Ready! %s - %s', bot.username, bot.id);
});

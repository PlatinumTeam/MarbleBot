var Discord = require("discord.io");
var WebSocket = require("ws");

var bot = new Discord.Client({
	token: process.argv[2],
	autorun: true
});

var wss = new WebSocket.Server({
	port: 28069
});

bot.on('ready', function() {
	console.log('Ready! %s - %s', bot.username, bot.id);
});

wss.on('connection', function(ws) {
	ws.on('message', function(message) {

	});
});
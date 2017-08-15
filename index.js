var Discord = require("discord.io");
var Server = require("./sockets/Server");
var Socket = require("./sockets/Socket");

var bot = new Discord.Client({
	token: process.argv[2],
	autorun: true
});

bot.on('ready', function() {
	console.log('Ready! %s - %s', bot.username, bot.id);
});

var server = new Server();
server.onConnection((socket) => {
	console.log("Connection from socket type " + socket.socketType());
	console.log("  Address: " + socket.address);
	console.log("  Port: " + socket.port);

	socket.onDataReceived((data) => {
    	console.log("Received Data: " + data);
	});
	
	socket.onDisconnect(() => {
		console.log("Connection disconnected.");
		console.log("  Address: " + socket.address);
		console.log("  Port: " + socket.port);
	});
});

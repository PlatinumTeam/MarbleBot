var Discord = require("discord.io");
var WebSocket = require("ws");
var net = require("net");

var bot = new Discord.Client({
	token: process.argv[2],
	autorun: true
});

var wss = new WebSocket.Server({
	port: 28069
});
var server = net.createServer();
server.listen(42069, '0.0.0.0');

bot.on('ready', function() {
	console.log('Ready! %s - %s', bot.username, bot.id);
});

//TODO: Abstraction layer

server.on('connection', function(socket) {
	var address = socket.address();
	console.log('TCP Connect: ' + address.address + ':' + address.port);
	socket.on('end', function() {
		console.log('TCP Disconnect: ' + address.address + ':' + address.port);
	});
	socket.on('data', function(data) {
		console.log('TCP Data: ' + data);
	});
});

wss.on('connection', function(ws, req) {
	var address = req.connection.address();
	console.log('WS Connect: ' + address.address + ':' + address.port);
	ws.on('close', function() {
		console.log('WS Disconnect: ' + address.address + ':' + address.port);
	});
	ws.on('message', function(data) {
		console.log('WS Data: ' + data);
	});
});

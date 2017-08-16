const EventEmitter = require('events');
const Server = require("../sockets/Server");
const Discord = require("discord.io");

module.exports = class ChatServer extends EventEmitter {
	constructor(options) {
		super();

		let server = this.server = new Server(options.server);

		let bot = this.bot = new Discord.Client({
			token: options.botToken,
			autorun: true
		});

		bot.on('ready', function() {
			console.log('Ready! %s - %s', bot.username, bot.id);
		});

		server.on('connect', (socket) => {
			console.log("Connection from socket type " + socket.socketType());
			console.log("  Address: " + socket.address);
			console.log("  Port: " + socket.port);

			socket.on('message', (data) => {
				console.log("Received Data: " + data);
			});

			socket.on('disconnect', () => {
				console.log("Connection disconnected.");
				console.log("  Address: " + socket.address);
				console.log("  Port: " + socket.port);
			});
		});
	}
};
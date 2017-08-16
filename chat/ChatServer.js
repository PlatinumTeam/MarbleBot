const EventEmitter = require('events');
const Server = require("../sockets/Server");
const Discord = require("discord.js");

module.exports = class ChatServer extends EventEmitter {
	constructor(options) {
		super();
		this.options = options;

		let server = this.server = new Server(options.server);

		let bot = this.bot = new Discord.Client();
		bot.on('ready', function() {
			console.log('Ready! %s#%s - %s', bot.user.username, bot.user.discriminator, bot.user.id);
		});
		bot.login(options.bot.token).catch((e) => {
			console.error(e.message);
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
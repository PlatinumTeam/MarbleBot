const EventEmitter = require('events');
const Server = require("../sockets/Server");
const Discord = require("discord.js");
const Client = require("./Client");
const MessageHandler = require("./MessageHandler");

module.exports = class ChatServer extends EventEmitter {
	constructor(options) {
		super();
		this.options = options;

		let messageHandler = this.messageHandler = new MessageHandler(this);
		let server = this.server = new Server(options.server);
		let bot = this.bot = new Discord.Client();
		let clients = this.clients = [];

		bot.on('ready', () => {
			console.log('Ready! %s#%s - %s', bot.user.username, bot.user.discriminator, bot.user.id);
		});
		bot.login(options.bot.token).catch((e) => {
			console.error(e.message);
		});

		server.on('connect', (socket) => {
			let client = new Client(this, socket);

			clients.push(client);

			console.log("Connection from socket type " + socket.socketType());
			console.log("  Address: " + socket.address);
			console.log("  Port: " + socket.port);

			socket.on('message', (data) => {
				//Split the data into lines and pass to the handler
				data.split("\n").filter((line) => {
					return line.trim().length !== 0;
				}).forEach((line) => {
					//First word is the message type, rest is the contents
					let words = line.split(' ');
					let command = words.splice(0, 1).join(' '); //Get first word and chop off from the rest
					messageHandler.emit(command, client, words, words.join(' '));
				});

				console.log("Received Data: " + data);
			});

			socket.on('disconnect', () => {
				//Remove from clients list if it exists
				let index = clients.indexOf(client);
				if (index !== -1) {
					clients.splice(index, 1);
				}

				console.log("Connection disconnected.");
				console.log("  Address: " + socket.address);
				console.log("  Port: " + socket.port);
			});
		});

		this.on('notify', (info) => {

		});

		this.on('chat', (info) => {
			clients.forEach(function(client) {
				client.emit('chat', info);
			});
			let channel = bot.channels.get(options.bot.channel);
			channel.send(info.sender.username + ': ' + info.message).then((message) => {
				//
			}).catch((e) => {
				console.error(e.message);
			});
		});
	}
};
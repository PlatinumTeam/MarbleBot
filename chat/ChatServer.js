const EventEmitter = require('events');
const Server = require("../sockets/Server");
const Discord = require("discord.js");
const Client = require("./Client");
const MessageHandler = require("./MessageHandler");

module.exports = class ChatServer extends EventEmitter {
	constructor(options) {
		super();
		this.options = options;

		let server = this.server = new Server(options.server);
		let bot = this.bot = new Discord.Client();
		let clients = this.clients = [];

		bot.on('ready', () => {
			console.log('Ready! %s#%s - %s', bot.user.username, bot.user.discriminator, bot.user.id);
		});
		bot.login(options.bot.token).catch((e) => {
			console.error(e.message);
		});

		bot.on('message', (message) => {
			//Ignore our own messages
			if (message.author.id === bot.user.id || message.author.bot) {
				return;
			}
			if (message.channel.id === options.bot.channel) {
				this.emit('chat', {
					type: 'discord',
					data: message
				});
			}
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
					try {
						MessageHandler.sendCommand(command, client, words, words.join(' '));
					} catch (error) {
						//Could not send it, send an error
						client.sendMessage('INVALID');
					}
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
			//Got a chat message, break down the info about it
			let messageData = {};
			switch (info.type) {
				case 'discord':
					//TODO: See if they have a connected account and use its information
					messageData = {
						username: info.data.author.username,
						display: info.data.member.nickname || info.data.author.username,
						destination: '', //Always global
						access: 0,
						message: info.data.content
					};
					break;
				case 'webchat':
					messageData = {
						username: info.data.sender.username,
						display: info.data.sender.display,
						destination: info.data.destination,
						access: 0,
						message: info.data.message
					};
					break;
			}
			//Tell everyone on webchat even if they sent it
			clients.forEach(function(client) {
				client.sendMessage('CHAT', messageData);
			});

			//Don't send discord messages back to discord, that'd be pretty dumb
			if (info.type !== 'discord') {
				let channel = bot.channels.get(options.bot.channel);
				channel.send(info.data.sender.display + ': ' + info.data.message).then((message) => {
					//
				}).catch((e) => {
					console.error(e.message);
				});
			}
		});
	}
};
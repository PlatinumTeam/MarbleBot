const EventEmitter = require('events');
const request = require('request');
const Server = require("../sockets/Server");
const Discord = require("discord.js");
const Client = require("./Client");
const MessageHandler = require("./MessageHandler");

module.exports = class ChatServer extends EventEmitter {
	constructor(options) {
		super();
		this.options = options;

		this._getServerInfo(this._infoCallback.bind(this));
	}

	startServers() {
		let server = this.server = new Server(this.options.server);
		let bot = this.bot = new Discord.Client();
		let clients = this.clients = [];

		bot.on('ready', () => {
			console.log('Ready! %s#%s - %s', bot.user.username, bot.user.discriminator, bot.user.id);
		});
		bot.login(this.options.bot.token).catch((e) => {
			console.error(e.message);
		});

		bot.on('message', (message) => {
			//Ignore our own messages
			if (message.author.id === bot.user.id || message.author.bot) {
				return;
			}
			if (message.channel.id === this.options.bot.channel) {
				this.emit('chat', {
					type: 'discord',
					data: message
				});
			}
		});

		server.on('connect', (socket) => {
			//Connected a new client, add them to our list
			let client = new Client(this, socket);
			clients.push(client);

			//Kick the client if they don't respond
			let connectTimeout = setTimeout(() => {
				client.disconnect('Timeout');
			}, 10000);
			client.on('login', () => {
				clearTimeout(connectTimeout);
			});

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
	}

	registerHandlers() {
		this.on('notify', (info) => {

		});

		this.on('login', (client) => {
			//Client has logged in, do something

			//Send them the userlist
			client.sendUserlist(this.getUserlist());
			//Send them the info
			client.sendInfo(this.info);
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
						converted: info.data.content,
						message: this._deconvertMessage(info.data.content)
					};

					//If they attached any files add them to the end of the message
					let attachments = info.data.attachments;

					//This supports multiple attachments even though the Discord client
					// can only upload one at a time.
					attachments.keyArray().forEach((attachId) => {
						let attachment = attachments.get(attachId);
						//Append to the message if it has any text
						if (messageData.message.length > 0) {
							messageData.message += ' ' + attachment.url;
						} else {
							messageData.message = attachment.url;
						}
					});
					break;
				case 'webchat':
					messageData = {
						username: info.data.sender.username,
						display: info.data.sender.display,
						destination: info.data.destination,
						access: 0,
						message: info.data.message,
						converted: this._convertMessage(info.data.message)
					};
					break;
			}
			if (messageData.destination === '') {
				//Global message

				//Tell everyone on webchat even if they sent it
				this.clients.forEach((client) => {
					client.sendMessage('CHAT', messageData);
				});

				//Don't send discord messages back to discord, that'd be pretty dumb
				if (info.type !== 'discord') {
					let channel = this.bot.channels.get(this.options.bot.channel);
					channel.send(info.data.sender.display + ': ' + info.data.message).then((message) => {
						//
					}).catch((e) => {
						console.error(e.message);
					});
				}
			} else {
				//Private message

				//Send to just the client we mentioned
				let client = this.clients.find((client) => {
					return client.username === messageData.destination;
				});
				if (client === undefined) {
					//TODO: Maybe they're on Discord?
				} else {
					//Send just that client the message
					client.sendMessage('CHAT', messageData);
				}
			}
		});
	}

	getUserlist() {
		return this.clients.map((client) => {
			return {
				username: client.username,
				access: client.user.info.access,
				location: "", //TODO: Location
				display: client.display,
				color: client.user.info.colorValue,
				flair: client.user.info.titles.flair,
				prefix: client.user.info.titles.prefix,
				suffix: client.user.info.titles.suffix,
			};
		});
	}

	_getServerInfo(callback) {
		let requestURI = "https://marbleblast.com/pq/leader/api/Discord/ServerInfo.php";
		request(requestURI, (error, response, body) => {
			if (error) {
				callback(false, {message: error.message});
				return;
			}
			if (response.statusCode !== 200) {
				callback(false, {message: 'HTTP ' + statusCode});
				return;
			}
			let parsed = null;
			try {
				parsed = JSON.parse(body);
			} catch (error) {
				callback(false, {message: error.message});
				return;
			}
			if (parsed) {
				callback(true, parsed);
			}
		});
	}

	_infoCallback(success, info) {
		if (!success) {
			//RIP
			Process.exit(1);
			return;
		}

		//We're good to start
		this.info = info;
		this.startServers();
		this.registerHandlers();
	}

	/**
	 * Convert <@mentions> to @mentions in a message
	 */
	_deconvertMessage(message) {
		// <@userid> - user mention, convert to @User
		// <@!userid> - user mention with nickname, convert to @Nickname
		// <#channelid> - channel mention, convert to #channel
		// <@&roleid> - role mention, convert to @role
		// <:emoji:emojiid> - custom emoji, ??????

		const USER_MENTION_REGEX    = /<@(\d+)>/g;
		const NICK_MENTION_REGEX    = /<@!(\d+)>/g;
		const CHANNEL_MENTION_REGEX = /<#(\d+)>/g;
		const ROLE_MENTION_REGEX    = /<@&(\d+)>/g;
		const EMOJI_MENTION_REGEX   = /<:[a-zA-Z0-9_]+:(\d+)>/g;

		message = message.replace(USER_MENTION_REGEX, (match, userId, offset, string) => {
			//Look up the user's nickname
			let guild = this.bot.guilds.get(this.options.bot.server);
			let member = guild.members.get(userId);
			let nickname = member.nickname || member.user.username;
			//TODO: Webchat username resolve?
			return '@' + nickname;
		});
		message = message.replace(NICK_MENTION_REGEX, (match, userId, offset, string) => {
			//Look up the user's nickname
			let guild = this.bot.guilds.get(this.options.bot.server);
			let member = guild.members.get(userId);
			let nickname = member.nickname || member.user.username;
			//TODO: Webchat username resolve?
			return '@' + nickname;
		});
		message = message.replace(CHANNEL_MENTION_REGEX, (match, channelId, offset, string) => {
			//Find the channel name
			let guild = this.bot.guilds.get(this.options.bot.server);
			let channel = guild.channels.get(channelId);
			return '#' + channel.name;
		});
		message = message.replace(ROLE_MENTION_REGEX, (match, roleId, offset, string) => {
			//Get the role name
			let guild = this.bot.guilds.get(this.options.bot.server);
			let role = guild.roles.get(roleId);
			return '@' + role.name;
		});

		//TODO: Emoji?

		return message;
	}

	/**
	 * Convert @mentions to <@mentions> in a message
	 */
	_convertMessage(message) {
		//TODO: Parse this back

		return message;
	}
};
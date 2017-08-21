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
						converted: info.data.content,
						message: this._deconvertMessage(info.data.content)
					};

					//If they attached any files add them to the end of the message
					let attachments = info.data.attachments;

					//This supports multiple attachments even though the Discord client
					// can only upload one at a time.
					attachments.keyArray().forEach(function(attachId) {
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
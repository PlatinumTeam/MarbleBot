const EventEmitter = require('events');
const request = require('request');
const Server = require("../sockets/Server");
const Discord = require("discord.js");
const Client = require("./Client");
const MessageHandler = require("./MessageHandler");
const DiscordUtil = require("./DiscordUtil");

module.exports = class ChatServer extends EventEmitter {
	constructor(options) {
		super();
		this.options = options;
		this.clients = [];
		this.discordConnected = false;

		this._getServerInfo(this._infoCallback.bind(this));
	}

	startServers() {
		this._startDiscordServer();
		this._startGameServer();
	}

	_startDiscordServer() {
		this.bot = new Discord.Client();

		this.bot.on('ready', () => {
			console.log('Ready! %s#%s - %s', this.bot.user.username, this.bot.user.discriminator, this.bot.user.id);
			this.discordConnected = true;
		});
		this.bot.on('error', (e) => {
			this.discordConnected = false;
			console.error("Discord error: " + e);
			setTimeout(this._connectDiscord.bind(this), 100);
		});
		this.bot.on('disconnect', () => {
			//Because discord's api likes to drop... this happens every few hours actually
			this.discordConnected = false;
			console.error("Discord Dropped!");
			setTimeout(this._connectDiscord.bind(this), 100);
		});

		this.bot.on('message', (message) => {
			//Ignore our own messages
			if (message.author.id === this.bot.user.id || message.author.bot) {
				return;
			}
			if (message.channel.id === this.options.bot.channel) {
				this.emit('chat', {
					type: 'discord',
					data: message
				});
			}
		});
		this.bot.on('guildMemberAdd', (member) => {
			this.updateUserlists();
		});
		this.bot.on('guildMemberRemove', (member) => {
			this.updateUserlists();
		});
		this.bot.on('guildMemberUpdate', (oldMember, newMember) => {
			this.updateUserlists();
		});
		this.bot.on('presenceUpdate', (oldMember, newMember) => {
			if (oldMember.presence.status === newMember.presence.status) {
				return;
			}
			if (oldMember.presence.status === "offline") {
				//Login gotta update the whole list
				this.updateUserlists();
				return;
			}
			if (newMember.presence.status === "offline") {
				//Logout, likewise
				this.updateUserlists();
				return;
			}

			let location = 20; // (Discord)
			//online
			//offline
			//idle
			//dnd
			switch (newMember.presence.status) {
				case "offline": return;
				case "idle":
					location = 9; // (Away)
					break;
				case "dnd":
					location = 11; // (Busy)
					break;
				default:
					break;
			}
			let client = this.clients.find((client) => {
				return client.user.discordUser.id === newMember.user.id;
			});
			if (client === undefined) {
				this.notifyAll({
					type: 'setlocation',
					access: 0,
					client: {
						username: newMember.user.username,
						display: newMember.nickname || newMember.user.username
					},
					message: location
				});
			}
		});

		this._connectDiscord();
	}
	_connectDiscord() {
		this.bot.login(this.options.bot.token).catch((e) => {
			console.error(e.message);
		});
	}

	_startGameServer() {
		this.server = new Server(this.options.server);
		this.server.on('connect', (socket) => {
			//Connected a new client, add them to our list
			let client = new Client(this, socket);
			this.clients.push(client);

			//Kick the client if they don't respond
			let connectTimeout = setTimeout(() => {
				client.disconnect('Timeout');
			}, 10000);
			client.on('login', () => {
				clearTimeout(connectTimeout);
				this.notifyAll({
					type: 'login',
					access: 0,
					client: client,
					message: ''
				});
				this.updateUserlists();
			});
			client.on('logout', () => {
				this.notifyAll({
					type: 'logout',
					access: 0,
					client: client,
					message: ''
				});
				this.updateUserlists();
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
				let index = this.clients.indexOf(client);
				if (index !== -1) {
					this.clients.splice(index, 1);
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
			client.sendUserlist({
				users: this.getUserlist(),
				groups: this.getGroupList()
			});
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
				this.sendGameChat(messageData);

				//Don't send discord messages back to discord, that'd be pretty dumb
				if (info.type !== 'discord') {
					this.sendDiscordChat(messageData);
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

	/**
	 * Send a notification to all player on the game server.
	 * @param info Notification data, see NotifyMessage.js for contents
	 */
	notifyAll(info) {
		this.clients.forEach((client) => {
			client.sendMessage('NOTIFY', info);
		});
	}

	/**
	 * Send a chat message globally to all members connected to the game server
	 * @param messageData Message data to send, see ChatMessage.js for contents
	 */
	sendGameChat(messageData) {
		this.clients.forEach((client) => {
			client.sendMessage('CHAT', messageData);
		});
	}

	/**
	 * Send a message to the global Discord channel for this bot.
	 * @param messageData Message data to send, needs a display and message field
	 */
	sendDiscordChat(messageData) {
		let channel = this.bot.channels.get(this.options.bot.channel);
		channel.send(messageData.display + ': ' + messageData.message).then((message) => {
			//
		}).catch((e) => {
			console.error(e.message);
		});
	}

	/**
	 * Send the user list to all game clients on the server
	 */
	updateUserlists() {
		let list = {
			users: this.getUserlist(),
			groups: this.getGroupList()
		};
		this.clients.forEach((client) => {
			//Send them the userlist
			client.sendUserlist(list);
		});
	}

	/**
	 * Get list of user "groups" composed of the hoisted roles that are grouped on Discord's sidebar
	 * @returns {Array} List of groups, not in any order
	 */
	getGroupList() {
		let groups = [];
		let guild = this.bot.guilds.get(this.options.bot.server);

		guild.roles.forEach((role) => {
			//groupId ordering namePlural nameSingular
			if (role.hoist) {
				groups.push({
					group: role.id,
					ordering: role.position,
					name: DiscordUtil.formatRoleName(role.name)
				});
			}
		});
		groups.push({
			group: 1,
			ordering: 1,
			name: "Ingame"
		});
		groups.push({
			group: 0,
			ordering: 0,
			name: "Users"
		});

		return groups;
	}

	/**
	 * Get full list of users online ingame and on Discord.
	 * @returns {Array} Array of objects with user info
	 */
	getUserlist() {
		let users = {};
		let guild = this.bot.guilds.get(this.options.bot.server);

		guild.members.forEach((member) => {
			if (member.user.bot) {
				return;
			}
			let location = 20; // (Discord)
			//online
			//offline
			//idle
			//dnd
			switch (member.presence.status) {
				case "offline": return;
				case "idle":
					location = 9; // (Away)
					break;
				case "dnd":
					location = 11; // (Busy)
					break;
				default:
					break;
			}

			users[member.user.id] = {
				username: member.user.username,
				group: DiscordUtil.getHoistedRoleId(member),
				location: location,
				display: member.nickname || member.user.username,
				color: DiscordUtil.getUserColor(member),
				flair: "",
				prefix: "",
				suffix: ""
			};
		});

		this.clients.forEach((client) => {
			//Update discord user info with this client's info if we can
			let discordId = client.user.discordUser.id;
			if (discordId !== 0) {
				if (users.hasOwnProperty(discordId)) {
					users[discordId].location = client.location;
					users[discordId].color = client.user.info.colorValue;
					users[discordId].flair = client.user.info.titles.flair;
					users[discordId].prefix = client.user.info.titles.prefix;
					users[discordId].suffix = client.user.info.titles.suffix;
					if (users[discordId].group === "0") {
						users[discordId].group = "1";
					}
					return;
				}
			}
			//Add user to list with their game info
			users[client.username] = {
				username: client.username,
				group: client.user.info.access,
				location: client.location,
				display: client.display,
				color: client.user.info.colorValue,
				flair: client.user.info.titles.flair,
				prefix: client.user.info.titles.prefix,
				suffix: client.user.info.titles.suffix,
			};
		});

		return Object.values(users);
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
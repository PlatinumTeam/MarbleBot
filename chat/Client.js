const EventEmitter = require('events');
const User = require('./User');
const MessageHandler = require('./MessageHandler');

module.exports = class Client extends EventEmitter {
	get username() {
		return this._username;
	}
	set username(value) {
		this._username = value;
	}

	constructor(server, socket) {
		super();

		this.server = server;
		this._socket = socket;
		this.location = 0;

		this._username = '';
		this.loggedIn = false;

		this.on('login', () => {
			this.loggedIn = true;

			//Start a ping timer
			this.pingInterval = setInterval(() => {
				//Check if they got the last ping through
				if (this.lastPing !== undefined && !this.lastPing.received) {
					//No they didn't, they've timed out
					this.disconnect('Timeout');
				} else {
					let pingData = new Date().valueOf().toString();
					try {
						this.sendMessage('PING', pingData);
					} catch (e) {
						//Threw an error in pinging, so disconnect them
						this.disconnect('Connection error');
					}
				}
			}, 30000);
		});

		this.on('logout', () => {
			clearInterval(this.pingInterval);
		});
	}

	sendMessage(message, data) {
		MessageHandler.sendMessage(this, message, data);
	}

	sendUserlist(userlist) {
		this.sendMessage('USERLIST', userlist);
	}

	sendInfo(info) {
		this.sendMessage("INFO", info);
	}

	passwordLogin(info) {
		User.checkLogin(this.username, info, 'password', this._loginCallback.bind(this));
	}

	keyLogin(key) {
		User.checkLogin(this.username, key, 'key', this._loginCallback.bind(this));
	}

	_loginCallback(status, info) {
		if (status) {
			//Login was successful, give them a success
			this.sendMessage('IDENTIFY', 'SUCCESS');
			this.sendMessage('LOGGED');

			//Get some info
			this.userId = info.siteUser.id;
			this.display = info.info.display;
			this.user = info;

			//If we have a discord account connected then keep track of it
			this.discordId = info.discordUser.id;
			if (info.discordUser.id !== 0) {
				this.sendMessage('DISCORD', 1);
			} else {
				this.sendMessage('DISCORD', 0);
			}

			//Tell the server we've logged in so it can update userlists
			this.emit('login');
			this.server.emit('login', this);
		} else {
			switch (info.message) {
				case "Out of date client":
					//Version too low
					this.sendMessage('IDENTIFY', 'OUTOFDATE');
					break;
				case "Login failed":
				case "Unknown discord user":
				case "Unknown user":
				case "Unknown login type":
				case "No accounts for user":
					//Some sort of client error
					this.sendMessage('IDENTIFY', 'INVALID');
					break;
				default:
					//Server error probably
					this.sendMessage('IDENTIFY', 'INVALID');
					break;
			}
			//Password was wrong or the site's down. Either way we can't get in
			this.disconnect('Login failure');
		}
	}

	_sendRaw(data) {
		this._socket.send(data);
	}

	disconnect(reason) {
		if (this.loggedIn) {
			this.emit('logout');
		}
		this._socket.disconnect(reason);
	}
};
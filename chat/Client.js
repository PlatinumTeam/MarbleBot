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
					this.sendMessage('PING', pingData);
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

	passwordLogin(password) {
		User.checkLogin(this.username, password, 'password', this._loginCallback.bind(this));
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
			this.userId = info.id;
			this.display = info.display;

			//If we have a discord account connected then keep track of it
			if (info.discord) {
				this.discordId = info.discordId;
				this.sendMessage('DISCORD', 1);
			} else {
				this.discordId = 0;
				this.sendMessage('DISCORD', 0);
			}

			//Tell the server we've logged in so it can update userlists
			this.emit('login');
			this.server.emit('login', this);
		} else {
			//Password was wrong or the site's down. Either way we can't get in
			this.sendMessage('IDENTIFY', 'INVALID');
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
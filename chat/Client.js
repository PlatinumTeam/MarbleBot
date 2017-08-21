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
			if (info.discord) {
				this.discordId = info.discordId;
				this.sendMessage('DISCORD', 1);
			} else {
				this.discordId = 0;
				this.sendMessage('DISCORD', 0);
			}
			this.server.sendMessage('login');
		} else {
			this.sendMessage('IDENTIFY', 'INVALID');
			this._disconnect('Login failure');
		}
	}

	_sendRaw(data) {
		this._socket.send(data);
	}

	_disconnect(reason) {
		this._socket.disconnect(reason);
	}
};
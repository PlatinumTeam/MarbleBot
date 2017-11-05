const EventEmitter = require('events');
const User = require('./User');
const MessageHandler = require('./MessageHandler');

LoggingStatus = {
	LoggedOut: 1,
	LoggingIn: 2,
	LoginFailed: 3,
	LoggedIn: 4,
};

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
		this.loggingStatus = LoggingStatus.LoggedOut;

		this.on('login', () => {
			this.loggingStatus = LoggingStatus.LoggedIn;

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
		if (this.loggingStatus === LoggingStatus.LoggedOut) {
			this.loggingStatus = LoggingStatus.LoggingIn;
			User.checkLogin(this.username, info, 'password', this._loginCallback.bind(this));
		}
	}

	keyLogin(key) {
		if (this.loggingStatus === LoggingStatus.LoggedOut) {
			this.loggingStatus = LoggingStatus.LoggingIn;
			User.checkLogin(this.username, key, 'key', this._loginCallback.bind(this));
		}
	}

	_loginCallback(status, info) {
		if (this.loggingStatus !== LoggingStatus.LoggingIn) {
			return;
		}

		if (status) {
			//Login was successful, give them a success
			this.sendMessage('IDENTIFY', 'SUCCESS');

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

			//Tell them we're done at the end
			this.sendMessage('LOGGED');
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
			this.loggingStatus = LoggingStatus.LoginFailed;
			//Password was wrong or the site's down. Either way we can't get in
			this.disconnect('Login failure');
		}
	}

	_sendRaw(data) {
		try {
			this._socket.send(data);
		} catch (error) {
			//Your socket is done for... RIP
			this.disconnect('Connection error');
		}
	}

	disconnect(reason) {
		if (this.loggingStatus === LoggingStatus.LoggedIn) {
			this.emit('logout');
		}
		try {
			this._socket.disconnect(reason);
		} catch (error) {
			//Wow you crashed on disconnect. That's pretty bad.
			this._socket = null;
		}
	}
};
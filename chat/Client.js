const EventEmitter = require('events');
const util = require('util');

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

		this.on('logged', () => {
			this._sendRaw('LOGGED');
		});
		this.on('chat', (info) => {
			this._sendRaw(util.format('CHAT %s %s %s %s %s',
				info.sender.username, //username
				info.sender.username, //display
				info.destination,
				0, //access
				info.message
			));
		});
	}

	_sendRaw(data) {
		this._socket.send(data);
	}
};
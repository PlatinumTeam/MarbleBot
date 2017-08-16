const EventEmitter = require('events');

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
	}

	_sendRaw(data) {
		this._socket.send(data);
	}
};
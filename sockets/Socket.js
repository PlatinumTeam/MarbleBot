const EventEmitter = require('events');

module.exports = class Socket extends EventEmitter {
	constructor() {
		super();

		this.port = 0;
		this.address = "0.0.0.0";
	}

	socketType() {
		return "unknown";
	}
};
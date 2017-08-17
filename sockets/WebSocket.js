const Socket = require("./Socket");

module.exports = class WebSocket extends Socket {
	constructor(nativeSocket, req) {
		super();

		// Set Address and Port
		let address = req.connection.address();
		this.address = address.address;
		this.port = address.port;

		this.nativeSocket = nativeSocket;
		this.nativeSocket.on('message', (message) => {
			this.emit('message', message);
		});
		this.nativeSocket.on('close', () => {
			this.emit('disconnect');
		});
	}

	socketType() {
		return "WebSocket";
	}

	send(data) {
		this.nativeSocket.send(data);
	}
};
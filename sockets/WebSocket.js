var Socket = require("./Socket");

module.exports = class WebSocket extends Socket {
	constructor(nativeSocket, req) {
		super();

		// Set Address and Port
		let address = req.connection.address();
		this.address = address.address;
		this.port = address.port;

		this.nativeSocket = nativeSocket;
	}

	onDataReceived(callback) {
		this.nativeSocket.on('message', callback);
	}

	onDisconnect(callback) {
		this.nativeSocket.on('close', () => {
			callback();
		});
	}

	socketType() {
		return "WebSocket";
	}
};
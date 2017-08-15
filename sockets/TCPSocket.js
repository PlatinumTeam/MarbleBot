var Socket = require("./Socket");

module.exports = class TCPSocket extends Socket {
	constructor(nativeSocket) {
		super();

		// Set Address and Port
		let address = nativeSocket.address();
		this.address = address.address;
		this.port = address.port;

		this.nativeSocket = nativeSocket;
	}

	onDataReceived(callback) {
		this.nativeSocket.on('data', callback);
	}

	onDisconnect(callback) {
		this.nativeSocket.on('end', () => {
			callback();
		});
	}

	socketType() {
		return "TCPSocket";
	}
};
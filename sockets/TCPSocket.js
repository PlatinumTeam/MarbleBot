const Socket = require("./Socket");

module.exports = class TCPSocket extends Socket {
	constructor(nativeSocket) {
		super();

		// Set Address and Port
		let address = nativeSocket.address();
		this.address = address.address;
		this.port = address.port;

		this.nativeSocket = nativeSocket;
		this.nativeSocket.on('data', (data) => {
			this.emit('message', data);
		});
		this.nativeSocket.on('end', () => {
			this.emit('disconnect');
		});
	}

	socketType() {
		return "TCPSocket";
	}

	send(data) {
		//TODO
	}
};
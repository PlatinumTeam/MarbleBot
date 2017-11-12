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
			let str = data.toString('utf8');
			let messages = str.split("\n");
			messages.forEach((message) => {
				message = message.trim();
				this.emit('message', message);
			})
		});
		this.nativeSocket.on('end', () => {
			this.emit('disconnect');
		});
		this.nativeSocket.on('error', (e) => {
			this.disconnect();
			this.emit('disconnect');
			console.error('Socket client error: ' + e);
		});
	}

	socketType() {
		return "TCPSocket";
	}

	send(data) {
		this.nativeSocket.write(data + "\n");
	}

	disconnect(reason) {
		this.nativeSocket.end(reason);
	}
};
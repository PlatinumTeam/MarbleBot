module.exports = class Socket {
	constructor() {
		this.port = 0;
		this.address = "0.0.0.0";
	}

	onDataReceived(callback) {
		// Abstract
	}

	onDisconnect(callback) {
		this.disconnectCb = callback;
	}

	socketType() {
		return "unknown";
	}
};
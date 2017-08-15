var wss = require("ws");
var net = require("net");
var TCPSocket = require("./TCPSocket");
var WebSocket = require("./WebSocket");

module.exports = class Server {
	constructor(options) {
		this.options = options;

		this.websocketServer = new wss.Server({
			port: options.ports.websocket
		});

		this.tcpServer = new net.createServer();
		this.tcpServer.listen(options.ports.tcp, options.subnetMask);
	}

	/**
	 * Called when a socket connects to the server.
	 * @param callback A callback function that takes a Socket for an argument.
	 */
	onConnection(callback) {
		this.tcpServer.on('connection', (s) => {
			let socket = new TCPSocket(s);
			callback(socket);
		});

		this.websocketServer.on('connection', (ws, req) => {
			let socket = new WebSocket(ws, req || ws.upgradeReq);
			callback(socket);
		});
	}
};
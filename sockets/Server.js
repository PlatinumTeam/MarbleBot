var wss = require("ws");
var net = require("net");
var TCPSocket = require("./TCPSocket");
var WebSocket = require("./WebSocket");

const WEBSOCKET_PORT = 28069;
const TCPSERVER_PORT = 42069;

module.exports = class Server {
	constructor() {
		this.websocketServer = new wss.Server({
			port: WEBSOCKET_PORT
		});

		this.tcpServer = new net.createServer();
		this.tcpServer.listen(TCPSERVER_PORT, '0.0.0.0');
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
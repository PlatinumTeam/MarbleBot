const wss = require("ws");
const net = require("net");
const TCPSocket = require("./TCPSocket");
const WebSocket = require("./WebSocket");
const Discord = require("discord.io");
const EventEmitter = require('events');

module.exports = class Server extends EventEmitter {
	constructor(options) {
		super();

		this.options = options;

		this.websocketServer = new wss.Server({
			port: options.ports.websocket
		});

		this.tcpServer = new net.createServer();
		this.tcpServer.listen(options.ports.tcp, options.subnetMask);

		let bot = this.bot = new Discord.Client({
			token: options.botToken,
			autorun: true
		});

		bot.on('ready', function() {
			console.log('Ready! %s - %s', bot.username, bot.id);
		});

		this.tcpServer.on('connection', (s) => {
			let socket = new TCPSocket(s);
			this.emit('connect', socket);
		});

		this.websocketServer.on('connection', (ws, req) => {
			let socket = new WebSocket(ws, req || ws.upgradeReq);
			this.emit('connect', socket);
		});
	}
};
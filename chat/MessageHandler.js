const EventEmitter = require('events');

module.exports = class MessageHandler extends EventEmitter {
	constructor(server) {
		super();
		this.server = server;

		this.on('IDENTIFY', (client, words, data) => {
			client.username = data;
			client.emit('logged');
		});
		this.on('KEY', (client, words, data) => {

		});
		this.on('CHAT', (client, words, data) => {

		});
	}
};
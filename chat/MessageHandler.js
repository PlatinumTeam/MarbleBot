const EventEmitter = require('events');

const commandDictionary = {};
commandDictionary['IDENTIFY'] = require('./Commands/IdentifyCommand');
commandDictionary['CHAT'] = require('./Commands/ChatCommand');
commandDictionary['VERIFY'] = require('./Commands/VerifyCommand');

module.exports = class MessageHandler extends EventEmitter {
	constructor(server) {
		super();
		this.server = server;

		for (let event in commandDictionary) {
			// Make sure handle is a function.
			if (commandDictionary[event].handle === undefined) {
				throw new Error("Event " + event + " class does not have a static 'handle' definition.");
			}

			this.on(event, (client, words, data) => {
				commandDictionary[event].handle(client, words, data);
			});
		}
	}
};
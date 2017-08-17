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
			// Make sure handle and parse are functions.
			if (commandDictionary[event].handle === undefined) {
				throw new Error("Event " + event + " does not have a 'handle' function definition.");
			}
			if (commandDictionary[event].parse === undefined) {
				throw new Error("Event " + event + " does not have a 'parse' function definition.");
			}

			this.on(event, (client, words, data) => {
				commandDictionary[event].handle(client, commandDictionary[event].parse(words, data));
			});
		}
	}
};
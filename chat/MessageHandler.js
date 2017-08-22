const commandDictionary = {};
commandDictionary['IDENTIFY'] = require('./Commands/IdentifyCommand');
commandDictionary['VERIFY'] = require('./Commands/VerifyCommand');
commandDictionary['KEY'] = require('./Commands/KeyCommand');
commandDictionary['CHAT'] = require('./Commands/ChatCommand');
commandDictionary['PING'] = require('./Commands/PingCommand');
commandDictionary['PONG'] = require('./Commands/PongCommand');

const messageDictionary = {};
messageDictionary['INVALID'] = require('./Messages/InvalidMessage');
messageDictionary['LOGGED'] = require('./Messages/LoggedMessage');
messageDictionary['IDENTIFY'] = require('./Messages/IdentifyMessage');
messageDictionary['CHAT'] = require('./Messages/ChatMessage');
messageDictionary['DISCORD'] = require('./Messages/DiscordMessage');
messageDictionary['PING'] = require('./Messages/PingMessage');
messageDictionary['PONG'] = require('./Messages/PongMessage');
messageDictionary['PINGTIME'] = require('./Messages/PingTimeMessage');

module.exports = {
	sendCommand: (command, client, words, data) => {
		if (commandDictionary[command] === undefined) {
			throw new Error("Unknown command " + command);
		}
		// Make sure handle and parse are functions.
		if (commandDictionary[command].handle === undefined) {
			throw new Error("Command " + command + " does not have a 'handle' function definition.");
		}
		if (commandDictionary[command].parse === undefined) {
			throw new Error("Command " + command + " does not have a 'parse' function definition.");
		}

		commandDictionary[command].handle(client, commandDictionary[command].parse(words, data));
	},
	sendMessage: (client, message, data) => {
		if (messageDictionary[message] === undefined) {
			throw new Error("Unknown message " + message);
		}
		// Make sure handle and parse are functions.
		if (messageDictionary[message].send === undefined) {
			throw new Error("Message " + message + " does not have a 'send' function definition.");
		}

		messageDictionary[message].send(client, data);
	}
};
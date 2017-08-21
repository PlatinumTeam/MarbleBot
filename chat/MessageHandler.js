const commandDictionary = {};
commandDictionary['IDENTIFY'] = require('./Commands/IdentifyCommand');
commandDictionary['VERIFY'] = require('./Commands/VerifyCommand');
commandDictionary['KEY'] = require('./Commands/KeyCommand');
commandDictionary['CHAT'] = require('./Commands/ChatCommand');

const messageDictionary = {};
messageDictionary['LOGGED'] = require('./Messages/LoggedMessage');
messageDictionary['IDENTIFY'] = require('./Messages/IdentifyMessage');
messageDictionary['CHAT'] = require('./Messages/ChatMessage');
messageDictionary['DISCORD'] = require('./Messages/DiscordMessage');

module.exports = {
	sendCommand: (command, client, words, data) => {
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
		// Make sure handle and parse are functions.
		if (messageDictionary[message].handle === undefined) {
			throw new Error("Command " + message + " does not have a 'handle' function definition.");
		}
		if (messageDictionary[message].parse === undefined) {
			throw new Error("Command " + message + " does not have a 'parse' function definition.");
		}

		messageDictionary[message].handle(client, data);
	}
};
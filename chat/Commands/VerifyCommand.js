let User = require('../User');

// Here are the status codes that the client will receive
// DISCORD_SUCCESS - your marble blast account is linked to discord
// NO_DISCORD_VERIFIED - your marble blast account is not linked to discord.
// NO_DISCORD_VERIFIED_ERROR - your account cannot be linked to discord because of an internal server error.
const DISCORD_SUCCESS = 'discord_registered';
const NO_DISCORD_VERIFIED = 'no_discord';
const NO_DISCORD_VERIFIED_ERROR = 'no_discord_error';

module.exports = {
	parse: (words, data) => {
		let version = words.splice(0, 1).join(); //Takes the first word off
		let password = words.join(' ');

		return {
			'version': version,
			'password': password
		};
	},
	handle: (client, parsed) => {
		User.hasDiscordAccountRegistered(client.username, parsed.password, (successResult) => {
			if (successResult)
				client.emit(DISCORD_SUCCESS);
			else
				client.emit(NO_DISCORD_VERIFIED);
		},
		() => { // Error
			console.log("Error with checking discord account registered into our system.");
			client.emit(NO_DISCORD_VERIFIED_ERROR);
		});
	}
};
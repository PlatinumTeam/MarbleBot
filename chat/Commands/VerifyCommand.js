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
		//TODO: Check server version
		client.passwordLogin(parsed.password);
	}
};
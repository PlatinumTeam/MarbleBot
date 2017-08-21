module.exports = {
	parse: (words, data) => {
		return {
			key: data
		};
	},
	handle: (client, parsed) => {
		client.keyLogin(parsed.key);
	}
};
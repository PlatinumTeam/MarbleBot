module.exports = {
	parse: (words, data) => {
		return {
			username: data
		};
	},
	handle: (client, parsed) => {
		client.username = parsed.username;
		client.emit('logged');
	}
};
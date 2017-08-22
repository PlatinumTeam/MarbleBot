module.exports = {
	parse: (words, data) => {
		return {
			data: data
		};
	},
	handle: (client, parsed) => {
		client.sendMessage('PONG', parsed.data);
	}
};
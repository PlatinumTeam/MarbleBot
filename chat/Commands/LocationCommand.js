module.exports = {
	parse: (words, data) => {
		return {
			location: data
		};
	},
	handle: (client, parsed) => {
		client.location = parsed.location;

		client.server.notifyAll({
			type: 'setlocation',
			access: 0,
			client: client,
			message: parsed.location
		});
	}
};
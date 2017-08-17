module.exports = {
	parse: (words, data) => {
		let destination = words.splice(0, 1).join(); //Takes the first word off
		let message = words.join(' ');

		return {
			destination: destination,
			message: message
		};
	},
	handle: (client, parsed) => {
		//Mark the message as ours
		parsed.sender = client;

		client.emit('chat', parsed);
	}
};
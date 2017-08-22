module.exports = {
	parse: (words, data) => {
		return {
			data: data
		};
	},
	handle: (client, parsed) => {
		//Check their last ping and see if it matches

		if (client.lastPing.data === parsed.data) {
			//Get ping time in whole seconds
			let time = (new Date() - client.lastPing.time) / 1000;
			//Let them know
			client.sendMessage('PINGTIME', time);

			client.lastPing.received = true;
		} else {
			//How can you mess up a PING/PONG? Even my dog can do this
			client.disconnect('Invalid ping');
		}
	}
};
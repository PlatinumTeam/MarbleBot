const util = require('util');

module.exports = {
	send: (client, data) => {
		client.lastPing = {
			data: data,
			time: new Date()
		};
		client._sendRaw(util.format('PING %s', data));
	}
};
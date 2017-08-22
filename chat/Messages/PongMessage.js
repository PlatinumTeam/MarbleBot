const util = require('util');

module.exports = {
	send: (client, data) => {
		client._sendRaw(util.format('PONG %s', data));
	}
};
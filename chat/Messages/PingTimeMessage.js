const util = require('util');

module.exports = {
	send: (client, time) => {
		client._sendRaw(util.format('PINGTIME %s', time));
	}
};
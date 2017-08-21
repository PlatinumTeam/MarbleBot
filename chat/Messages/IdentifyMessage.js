const util = require('util');

module.exports = {
	send: (client, info) => {
		client._sendRaw(util.format('IDENTIFY %s', info));
	}
};
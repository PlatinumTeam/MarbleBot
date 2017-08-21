const util = require('util');

module.exports = {
	send: (client, info) => {
		client._sendRaw(util.format('CHAT %s %s %s %s %s',
			info.username,
			info.display,
			info.destination,
			info.access,
			info.message
		));
	}
};
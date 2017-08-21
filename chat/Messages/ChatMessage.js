const util = require('util');

module.exports = {
	send: (client, info) => {
		client._sendRaw(util.format('CHAT %s %s %s %s %s',
			info.sender.username, //username
			info.sender.username, //display
			info.destination,
			0, //access
			info.message
		));
	}
};
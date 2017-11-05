const util = require('util');
const StringUtils = require('../StringUtils');

module.exports = {
	send: (client, info) => {
		client._sendRaw(util.format('CHAT %s %s %s %s %s',
			StringUtils.encodeName(info.username),
			StringUtils.encodeName(info.display),
			StringUtils.encodeName(info.destination),
			info.access,
			info.message
		));
	}
};
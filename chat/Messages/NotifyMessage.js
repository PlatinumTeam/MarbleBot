const util = require('util');
const StringUtils = require('../StringUtils');

module.exports = {
	send: (client, info) => {
		client._sendRaw(util.format("NOTIFY %s %s %s %s %s",
			info.type,
			info.access,
			StringUtils.encodeName(info.client.username),
			StringUtils.encodeName(info.client.display),
			info.message
		))
	}
};

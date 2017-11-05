const util = require('util');
const StringUtils = require('../StringUtils');

module.exports = {
	send: (client, info) => {
		client._sendRaw(util.format("INFO ACCESS %s", client.user.info.access));
		client._sendRaw(util.format("INFO DISPLAY %s", client.display));
		client._sendRaw(util.format("INFO DEFAULT %s", info.default_name));
		client._sendRaw(util.format("INFO HELP INFO %s", info.chat_help));
		//TODO: Privilege != access
		client._sendRaw(util.format("INFO PRIVILEGE %s", client.user.info.access));

		//TODO: Mod status
		let welcome = client.user.info.access >= 0 ? info.welcome.mod : info.welcome.user;
		client._sendRaw(util.format("INFO WELCOME %s", welcome));

		//TODO: Send friends
		//TODO: Send blocks
		info.statuses.forEach(function(status) {
			client._sendRaw(util.format("STATUS %s %s", status.status, status.display));
		});
		info.colors.forEach(function(color) {
			client._sendRaw(util.format("COLOR %s %s", color.ident, color.color));
		});
		info.flair.forEach(function(flair) {
			client._sendRaw(util.format("FLAIR %s", flair));
		})
	}
};

const util = require('util');
const StringUtils = require('../StringUtils');

module.exports = {
	send: (client, data) => {
		client._sendRaw("USER START");

		data.groups.forEach((group) => {
			client._sendRaw(util.format('USER GROUP %s %s %s %s',
				group.group,
				group.ordering,
				StringUtils.encodeName(group.name),
				StringUtils.encodeName(group.name)
			))
		});

		//Send all users in the user list
		data.users.forEach((user) => {
			let info = util.format("%s %s %s %s %s %s %s %s",
				StringUtils.encodeName(user.username),
				user.group,
				user.location,
				StringUtils.encodeName(user.display),
				user.color,
				StringUtils.encodeName(user.flair) || "",
				StringUtils.encodeName(user.prefix) || "",
				StringUtils.encodeName(user.suffix) || ""
			);
			client._sendRaw(util.format("USER INFO %s", info));
		});

		client._sendRaw("USER DONE");
	}
};
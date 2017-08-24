const request = require("request");

module.exports = class User {
	constructor() {
		this.siteUser = undefined;
		this.discordUser = undefined;
	}

	static checkLogin(username, password, type, callback) {
		//Query the site and see if we can log in
		let requestURI = 'https://marbleblast.com/pq/leader/api/Discord/CheckLogin.php'
			+ '?username=' + encodeURIComponent(username);
		switch (type) {
			case 'password': requestURI += '&password=' + encodeURIComponent(password); break;
			case 'key': requestURI += '&key=' + encodeURIComponent(password); break;
			default:
				//Wtf type of login are you trying to do
				callback(false, {message:  "Unknown login type"});
				return;
		}
		request(requestURI, (error, response, body) => {
			if (error) {
				callback(false, {message: error.message});
				return;
			}

			//If the page didn't work then our login didn't work either
			if (response.statusCode !== 200) {
				callback(false, {message: 'HTTP ' + statusCode});
				return;
			}

			try {
				//Oh yeah, we got it
				let parsed = JSON.parse(body);
				//Tell the callback
				callback(parsed.status, parsed);
			} catch (error) {
				callback(false, {message: error.message});
			}
		});
	}

	static fromDiscord(discordUser) {
		let user = new User();
		user.discordUser = discordUser;
		let requestURI = 'https://marbleblast.com/pq/leader/api/Discord/GetUserInfo.php?discordId=' + discordUser.id;

		request(requestURI, (error, response, body) => {
			if (response.statusCode !== 200) {
				//Couldn't do it
				console.log('Could not find site account for discord user id ' + discordUser.id);
				return;
			}

			try {
				//Oh yeah, we got it
				user.siteUser = JSON.parse(body);
				console.log('Found site account for ' + discordUser.id);
			} catch (e) {
				console.error(e.message);
			}
		});
	}
};
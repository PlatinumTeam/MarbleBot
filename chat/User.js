const request = require("request");

module.exports = class User {
	constructor() {
		this.siteUser = {id: 0};
		this.discordUser = {id: 0};
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

				if (!parsed.status) {
					callback(parsed.status, parsed);
					return;
				}

				//Create a new user with their accounts
				let user = new User();
				user.siteUser.id = parsed.id;
				if (parsed.discord) {
					user.discordUser.id = parsed.discordId;
				}

				//Get their info
				this.getUserInfo(user, callback);
			} catch (error) {
				callback(false, {message: error.message});
			}
		});
	}

	static getUserInfo(user, callback) {
		let requestURI = 'https://marbleblast.com/pq/leader/api/Discord/GetUserInfo.php';

		//Get which account we're using for them
		if (user.discordUser.id === 0 && user.siteUser.id === 0) {
			callback(false, {message: "No accounts for user."});
			return;
		}
		if (user.discordUser.id === 0) {
			requestURI += "?userId=" + user.siteUser.id;
		} else {
			requestURI += "?discordId=" + user.discordUser.id;
		}

		request(requestURI, (error, response, body) => {
			if (error) {
				callback(false, {message: error.message});
				return;
			}
			//If the page didn't work then our login didn't work either
			if (response.statusCode !== 200) {
				callback(false, {message: 'HTTP ' + response.state});
				return;
			}

			try {
				//Oh yeah, we got it
				let parsed = JSON.parse(body);

				if (!parsed.status) {
					callback(parsed.status, parsed);
					return;
				}

				//We're good
				user.info = parsed;
				callback(true, user);
			} catch (error) {
				callback(false, {message: error.message});
			}
		});
	}
};
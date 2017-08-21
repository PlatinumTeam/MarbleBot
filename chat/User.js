const https = require('https');

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
		const req = https.get(requestURI, (res) => {
			const {statusCode} = res;
			const contentType = res.headers['content-type'];

			//If the page didn't work then our login didn't work either
			if (statusCode !== 200) {
				callback(false, {message: 'HTTP ' + statusCode});
				return;
			}

			//Get the response from the request
			let rawData = '';
			res.on('data', (chunk) => {
				rawData += chunk;
			});
			res.on('end', () => {
				try {
					//Oh yeah, we got it
					const parsed = JSON.parse(rawData);
					//Tell the callback
					callback(parsed.status, parsed);
				} catch (error) {
					callback(false, {message: error.message});
				}
			});
		}).on('error', (error) => {
			callback(false, {message: error.message});
		})
	}

	static fromDiscord(discordUser) {
		let user = new User();
		user.discordUser = discordUser;
		let requestURI = 'https://marbleblast.com/pq/leader/api/Discord/GetUserInfo.php?discordId=' + discordUser.id;

		const req = https.get(requestURI,
			(res) => {
			const { statusCode } = res;
			const contentType = res.headers['content-type'];

			let error;
			if (statusCode !== 200) {
				//Couldn't do it
				res.resume();
				console.log('Could not find site account for discord user id ' + discordUser.id);
				return;
			}

			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					//Oh yeah, we got it
					const parsed = JSON.parse(rawData);
					user.siteUser = parsed;
					console.log('Found site account for ' + discordUser.id);
				} catch (e) {
					console.error(e.message);
				}
			});
		}).on('error', (e) => {
			console.log(e.message);
		});
	}
};
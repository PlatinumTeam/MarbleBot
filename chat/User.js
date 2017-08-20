const https = require('https');

module.exports = class User {
	constructor() {
		this.siteUser = undefined;
		this.discordUser = undefined;
	}

	static hasDiscordAccountRegistered(username, password, successCb, errorCb) {
		try {
			let requestURI = 'https://marbleblast.com/pq/leader/api/Discord/CheckLogin.php?username=' +
				encodeURIComponent(username) +
				'&password=' +
				encodeURIComponent(password);
			const req = https.get(requestURI, (res) => {
				const {statusCode} = res;
				const contentType = res.headers['content-type'];

				if (statusCode !== 200) {
					//Couldn't do it
					res.resume();
					console.log('Could not find site account for discord user id ' + discordUser.id);
					return;
				}

				let rawData = '';
				res.on('data', (chunk) => {
					rawData += chunk;
				});
				res.on('end', () => {
					// We got the result.
					if (rawData == 1)
						successCb(true);
					else
						successCb(false);
				});
			}).on('error', (error) => {
				console.log('Error with checking if we have a discord account registered. ' + error.message);
				errorCb();
			});
		} catch (e) {
			console.log("Fatal error with retreiving information on discord account." + error.message);
			errorCb();
		}
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
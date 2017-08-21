module.exports = {
	send: (client, info) => {
		client._sendRaw('LOGGED');
	}
};
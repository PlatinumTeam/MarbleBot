module.exports = {
	send: (client) => {
		client._sendRaw('INVALID');
	}
};
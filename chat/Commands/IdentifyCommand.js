module.exports = class IdentifyCommand {
	static handle(client, words, data) {
		client.username = data;
		client.emit('logged');
	}
};
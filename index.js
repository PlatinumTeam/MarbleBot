const ChatServer = require("./chat/ChatServer");

let server = new ChatServer({
	server: {
		ports: {
			websocket: 28069,
			tcp: 42069
		},
		subnetMask: '0.0.0.0',
	},
	bot: {
		token: process.argv[2],
		server: '346034549962047488',
		channel: '376839367609548800'
	}
});

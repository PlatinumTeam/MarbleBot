const ChatServer = require("./chat/ChatServer");

let server = new ChatServer({
	server: {
		ports: {
			websocket: 28069,
			tcp: 42069
		},
		subnetMask: '0.0.0.0',
	},
	botToken: process.argv[2]
});

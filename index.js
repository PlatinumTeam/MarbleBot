const Server = require("./sockets/Server");

let server = new Server({
	ports: {
		websocket: 28069,
		tcp: 42069
	},
	subnetMask: '0.0.0.0',
	botToken: process.argv[2]
});

server.on('connect', (socket) => {
	console.log("Connection from socket type " + socket.socketType());
	console.log("  Address: " + socket.address);
	console.log("  Port: " + socket.port);

	socket.on('message', (data) => {
    	console.log("Received Data: " + data);
	});
	
	socket.on('disconnect', () => {
		console.log("Connection disconnected.");
		console.log("  Address: " + socket.address);
		console.log("  Port: " + socket.port);
	});
});

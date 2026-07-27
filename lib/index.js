const net = require('net');
const handleConnect = require('./handleConnect');

exports.server = (server) => {
  server.on('connect', (req, socket) => {
    req.connect(function(client) {
      handleConnect(socket, client, req);
    });
  });
};

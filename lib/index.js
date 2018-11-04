const net = require('net');
const handleConnect = require('./handleConnect');

const PORT = 27323;
const noop = _ => _;
const startMockServer = () => {
  const server = net.createServer((socket) => {
    socket.on('error', noop);
    socket.on('data', (data) => {
      console.log(`${data}`);
      socket.write(data);
    });
  });
  server.listen(PORT);
};

exports.server = (server) => {
  startMockServer();
  server.on('connect', handleConnect);
};

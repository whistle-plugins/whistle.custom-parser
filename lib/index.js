const net = require('net');
const url = require('url');
const handleConnect = require('./handleConnect');

const PORT = 27323;
const noop = _ => _;
const startMockServer = () => {
  const server = net.createServer((socket) => {
    socket.on('error', noop);
    socket.on('data', (data) => {
      // console.log(`${data}`);
      socket.write(data);
    });
  });
  server.listen(PORT);
};

exports.server = (server) => {
  startMockServer();
  server.on('connect', (req, socket) => {
    const { port } = url.parse(`http://${req.url}`);
    // req.sendEstablished([err])，通知whistle建立连接成功或失败
    // 如果err不为空表示建立连接失败，whistle会自动中断连接
    const client = net.connect({
      port,
      host: '127.0.0.1',
    }, () => {
      req.sendEstablished();
      handleConnect(socket, client, req);
    });
    client.on('error', req.sendEstablished);
  });
};

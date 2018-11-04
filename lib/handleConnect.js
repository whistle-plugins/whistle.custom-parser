const net = require('net');
const url = require('url');

const noop = _ => console.log(_);
/**
 * 本方法主要涉及以下API：
 * 1. req.sendEstablished(err)：err为空或错误对象，通知whistle是否成功建立连接
 * 2. req.on('sendStateChange', (curState, prevState) => {})：表示Frames/Composer切换发送的状态：正常、pause、ignore
 * 3. req.on(receiveStateChange, (curState, prevState) => {})：表示Frames/Composer切换接收的状态：正常、pause、ignore
 * 4. req.curSendState，表示当前发送状态：正常、pause、ignore
 * 5. req.curReceiveState，表示当前接收状态：正常、pause、ignore
 * 6. req.on('sendToServer', (data, isBinary) => {})：表示Frames/Composer里面点击Send To Server
 *    按钮传过来的数据，data为Buffer对象，isBinary表示是为二进制数据
 * 7. req.on('sendToClient', (data, isBinary) => {})：表示Frames/Composer里面点击Send To Client
 *    按钮传过来的数据，data为Buffer对象，isBinary表示是为二进制数据
 * 8. req.emit('clientFrame', data, opts)，要在Frames/Composer里面显示的客户端发送的贞数据，
 *    opts如果为true，表示为ignore状态，opts也可以为对象(如果是普通长连接无需用到对象)，可以设置以下属性：
 *    - ignore：会在Frame里面显示ignore状态
 *    - isError: 显示红色字体，一般用于表示某个包解析失败
 *    - compressed：表示是显示为压缩的数据，这些字段一般是给websocket使用的
 *    - charset：编码，默认会自动识别编码
 *    - opcode：同websocket，一般不填、1表示Text、2表示二进制
 * 9. req.emit('serverFrame', data, opts)，要在Frames/Composer里面显示的服务端发送的贞数据，
 *    opts同上面
 * 
 */
module.exports = (req, client) => {
  const { port } = url.parse(`http://${req.url}`);
  // req.sendEstablished([err])，通知whistle建立连接成功或失败
  // 如果err不为空表示建立连接失败，whistle会自动中断连接
  const server = net.connect({
    port,
    host: '127.0.0.1',
  }, req.sendEstablished);
  server.on('error', req.sendEstablished);
  client.on('error', noop);
  // state 为 空、pause、ignore三种状态
  // 分别表示正常发送、暂停发送（接收）请求
  // 或不暂停但忽略当前请求
  req.on('sendStateChange', (/* curState, prevState */) => {
    if (req.curSendState === 'pause') {
      client.pause();
    } else {
      client.resume();
    }
  });
  req.on('receiveStateChange', (/* curState, prevState */) => {
    if (req.curReceiveState === 'pause') {
      server.pause();
    } else {
      server.resume();
    }
  });
  // 监听Network/Frames/Composer构造的发送到服务端的数据
  // data 统一为Buffer对象
  req.on('sendToServer', (data) => {
    // 这种数据不管什么状态都要发送出去
    req.emit('clientFrame', `Client: ${data}`);
    server.write(data); 
  });
  // 监听Network/Frames/Composer构造的发送到客户端的数据
  // data 统一为Buffer对象
  req.on('sendToClient', (data) => {
    // 这种数据不管什么状态都要发送出去
    req.emit('serverFrame', `Server: ${data}`);
    client.write(data);
  });

  client.on('data', (data) => {
    // 在Network/Frames显示客户端发送的数据包
    // 支持emit：buffer、字符串、数字、对象等等各种类型
    const ignore = req.curSendState === 'ignore';
    req.emit('clientFrame', `Client: ${data}`, ignore);
    if (!ignore) {
      server.write(data);
    }
  });
  server.on('data', (data) => {
    // 在Network/Frames显示服务端发送的数据包
    // 支持emit：buffer、字符串、数字、对象等等各种类型
    const ignore = req.curReceiveState === 'ignore';
    req.emit('serverFrame', `Server: ${data}`, ignore);
    if (!ignore) {
      client.write(data);
    }
  });
};
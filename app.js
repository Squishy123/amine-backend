const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);


io.on('connection', (socket) => {
  console.log('Client Connected!')
  socket.on('message', (msg) => {
    io.emit('message', msg);
    console.log(`Message: ${msg}`)
  })

  socket.on('disconnect', () => {
    console.log('Client Disconnected!');
  })
})

http.listen(3000, function(){
  console.log('listening on *:3000');
});
    
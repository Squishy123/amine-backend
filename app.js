const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//add public folder
app.use(express.static(path.join(__dirname, 'public')));

//setup page routes
const pageRouter = require('./routes/pageRouter');
app.use('/', pageRouter);


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
    
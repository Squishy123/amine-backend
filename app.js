const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//scrapers
const scraper = require('./services/scrapers/9anime.js');
const main = require('./tasks/main.js')

//schemas
const Anime = require('./schemas/animeSchema.js');
const Episode = require('./schemas/episodeSchema.js');
const Source = require('./schemas/sourceSchema.js');

// database setup
mongoose.connect("mongodb://localhost:27017/media").then(() => {
  console.log("Connection to database successful!")
}).catch(err => console.log(err))

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
  /*
  socket.on('message', (msg) => {
    io.emit('message', msg);
    console.log(`Message: ${msg}`)
  })*/

  socket.on('disconnect', () => {
    console.log('Client Disconnected!');
  })
})

let api = io.of('/api');
api.on('connection', (socket) => {
  //searching animes
  socket.on('search/animes', async (query) => {
    if (query)
      await Anime.find(query, (err, animes) => {
        if (err) return api.emit('search/animes:result', err)
        if (animes.length == 0) return api.emit('search/animes:result', null)
        return api.emit('search/animes:result', animes);
      });
    else
      await Anime.find({}, (err, animes) => {
        if (err) return api.emit('search/animes:result', err)
        if (animes.length == 0) return api.emit('search/animes:result', null)
        return api.emit('search/animes:result', animes);
      });
  });
  //searches for an episode
  socket.on('search/episode', async(query) => {
    if (query)
        await Episode.find(query, (err, e) => {
            if (err) return api.emit('search/episode:result', err)
            if (!e) return api.emit('search/episode:result', null)
            return api.emit('search/episode:result', e);
        });
    else
        await Episode.find({}, (err, episodes) => {
          if (err) return api.emit('search/episode:result', err)
          if (!e) return api.emit('search/episode:result', null)
          return api.emit('search/episode:result', e);
        });
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});

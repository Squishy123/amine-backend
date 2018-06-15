const app = require('express')();
const express = require('express');
const session = require('express-session');
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);

const async = require('async');


const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const MongoStore = require('connect-mongo')(session)

//scrapers
const scraper = require('./services/scrapers/9anime.js');
const main = require('./tasks/main.js')

//schemas
const Anime = require('./schemas/animeSchema.js');
const Account = require('./schemas/accountSchema.js');
const Episode = require('./schemas/episodeSchema.js');
const Source = require('./schemas/sourceSchema.js');

//puppet stuff
const puppeteer = require('puppeteer');
const scrape = require('9anime-scraper')

const proxyList = require('./proxyList.json');
const proxySettings = require('./proxySettings.json');

//request stuff
const cheerio = require('cheerio');
const request = require('request');

// database setup
mongoose.connect("mongodb://localhost:27017/media").then(() => {
  console.log("Connection to database successful!")
}).catch(err => console.log(err))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//body parser
app.use(require('body-parser')());

//sessions
app.use(session({ secret: 'work hard', resave: 'true', saveUninitialized: false, store: new MongoStore({ mongooseConnection: mongoose.connection }) }));

//add public folder
app.use(express.static(path.join(__dirname, 'public')));

//setup page routes
const pageRouter = require('./routes/pageRouter');
app.use('/', pageRouter);

const authRouter = require('./routes/authRouter');
app.use('/', authRouter);

//Manage login and register routes
/*
let acc = io.of('/acc');
acc.on('connection', (socket) => {
  //register
  socket.on('register', async (query) => {
    console.log(query)
    if (query.email && query.username && query.password && query.passwordConf) {
      await Account.create(query, (err, user) => {
        if (err) return acc.emit('register/error', err);
        else return acc.emit('register/success')
      });
    }
  })
})*/

let api = io.of('/api');
api.on('connection', (socket) => {
  //searching animes
  socket.on('search/animes', async (query) => {
    if (query)
      await Anime.find(query, (err, animes) => {
        if (err) return api.emit(`search/animes:result/${query.title}`, err)
        if (animes.length == 0) return api.emit(`search/animes:result/${query.title}`, null)
        return api.emit(`search/animes:result/${query.title}`, animes);
      });
    else
      await Anime.find({}, (err, animes) => {
        if (err) return api.emit(`search/animes:result/${query.title}`, err)
        if (animes.length == 0) api.emit(`search/animes:result/${query.title}`, null)
        return api.emit(`search/animes:result/${query.title}`, animes);
      });
  });
  //searches for an episode
  socket.on('search/episode', async (query) => {
    if (query)
      await Episode.find(query, (err, e) => {
        if (err) return api.emit(`search/episode:result/${query._id}`, err)
        if (!e) return api.emit(`search/episode:result/${query._id}`, null)
        return api.emit(`search/episode:result/${query._id}`, e);
      });
    else
      await Episode.find({}, (err, episodes) => {
        if (err) return api.emit(`search/episode:result/${query._id}`, err)
        if (!e) return api.emit(`search/episode:result/${query._id}`, null)
        return api.emit(`search/episode:result/${query._id}`, e);
      });
  });

  socket.on('request/anime', async (query) => {
    console.log("Requesting!")
    if (query) {
      await main.scrapeTitle(query.title);
      return api.emit(`request/anime:done/${query.title}`);
    }
  });

  //9anime search results
  socket.on('request/search', (query) => {
    if (query) {
      async.retry({ times: 100 },
        (cb, results) => {
          console.log("Tunnelling")
          let p = `http://${proxySettings.username}:${proxySettings.password}@${proxyList[Math.floor(Math.random() * Math.floor(proxyList.length))]}:80`;
          let r = request.defaults(p);
          console.log(p);
          r(`https://www5.9anime.is/search?keyword=${query.keyword}`, (err, res, body) => {
            if (!err) {
              const $ = cheerio.load(body);
              let results = [];
              let length = $('#main > div > div:nth-child(1) > div.widget-body > div.film-list').children().length;
              for (let c = 1; c <= length; c++) {
                if ($(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('href') && $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('data-jtitle'))
                  results.push({
                    poster: $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div`).find(`a.poster > img`).attr('src'),
                    href: $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('href'),
                    title: $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('data-jtitle')
                  });
              }
              return api.emit(`request/search:done/${query.keyword}`, [results]);
            }else {
              console.log("Tunnel Failed!")
              cb(new Error(`Tunnel Failed: ${p}`))
            }
          });
        }, (err, res) => {
          console.log(err);
        });
    }
  });

  socket.on('request/animeURL', async (query) => {
    console.log("Requesting!")
    if (query) {
      await main.scrapeURL(query.url, query.title);
      return api.emit(`request/animeURL:done/${query.url}`);
    }
  })
});

http.listen(80, function () {
  console.log('listening on *:80');
});

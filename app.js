const app = require('express')();
const express = require('express');
const session = require('express-session');
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);


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

//request stuff
const cheerio = require('cheerio');
const request = require('request-promise-native');

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
      return api.emit('request/anime:done');
    }
  });

  //9anime search results
  socket.on('request/search', async (query) => {
    if (query) {
      /*
      let browser = await puppeteer.launch();
      let page = await scrape.initPage(browser);
      let results = await scrape.getSearch(page, query.keyword, 1); 
      await page.close();
      await browser.close();*/
      await request(`https://www4.9anime.is/search?keyword=${query.keyword}`)
        .then((html) => {
          const $ = cheerio.load(html);
          let results = [];
          let length = $('#main > div > div:nth-child(1) > div.widget-body > div.film-list').children().length;
          for (let c = 0; c < length; c++) {
            if ($(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('href') && $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('data-jtitle'))
              results.push({
                poster: "null", //$(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.poster.tooltipstered > img`).attr('src'),
                href: $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('href'),
                title: $(`#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${c}) > div > a.name`).attr('data-jtitle')
              });
          }
          return api.emit('request/search:done', [results]);
        });
    }
  });

  socket.on('request/animeURL', async (query) => {
    console.log("Requesting!")
    if (query) {
      await main.scrapeURL(query.url);
      return api.emit('request/animeURL:done');
    }
  })
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});

var express = require('express');
let router = express.Router();
const mongoose = require('mongoose')

const puppeteer = require('puppeteer');
//scrapers
const anime = require('../services/9anime.js');
const main = require('../tasks/main.js')

//database
const db = require('../src/lib/database.js');

//schemas
const Anime = require('../schemas/animeSchema.js');
const Episode = require('../schemas/episodeSchema.js');
const Source = require('../schemas/sourceSchema.js');



router.get('/', (req, res) => {
    res.status(200).send('Server Online!')
});

function lookupAnime(req, res, next) {
    let title = req.params.animetitle;
    (async () => {
        await mongoose.connect("mongodb://localhost:27017/media");
        await Anime.find({ title: title }, (err, animes) => {
            if (err) {
                return res.status('500').send({ errors: err });
            }

            if (animes.length == 0) return res.status(404).send({ errors: 'No Animes Found' })
            req.results = animes;
            next();
        });
        await mongoose.disconnect();
    })()

}

router.get('/search/title/:animetitle', lookupAnime, (req, res) => {
    res.status(200).send(req.results);
})

function animeList(req, res, next) {
    (async () => {
        await mongoose.connect("mongodb://localhost:27017/media")
        await Anime.find({}, (err, animes) => {
            if (err) {
                return res.status('500').send({ errors: err });
            }

            if (animes.length == 0) return res.status(404).send({ errors: 'No Animes Found' })
            req.results = animes;
            next();
        })
        await mongoose.disconnect()
    })()
}

router.get('/animelist', animeList, (req, res) => {
    res.status(200).send(req.results);
})

function requestTitle(req, res, next) {
    let title = req.params.animetitle;
    (async () => {
        main.scrape(title);
        next()
    })()   
}

router.post('/request/title/:animetitle', requestTitle, (req, res) => {
    res.status(200).send("Scraping...")
})

module.exports = router;
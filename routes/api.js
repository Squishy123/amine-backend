var express = require('express');
let router = express.Router();
const mongoose = require('mongoose')

const puppeteer = require('puppeteer');
//scrapers
const scraper = require('../services/scrapers/9anime.js');
const main = require('../tasks/main.js')

//database
//const db = require('../src/lib/database.js');

//schemas
const Anime = require('../schemas/animeSchema.js');
const Episode = require('../schemas/episodeSchema.js');
const Source = require('../schemas/sourceSchema.js');

router.get('/', (req, res) => {
    res.status(200).send('Server Online!')
});

// router for /api/search/animes?title=
router.get('/search/animes', async (req, res, next) => {
    let title = req.query.title;
    if (title)
        await Anime.find({ title: title }, (err, animes) => {
            if (err) return res.status('500').send({ errors: err });
            if (animes.length == 0) return res.status(404).send({ errors: 'No Animes Found' })
            res.json(animes);
        });
    else
        await Anime.find({}, (err, animes) => {
            if (err) return res.status('500').send({ errors: err });
            if (animes.length == 0) return res.status(404).send({ errors: 'No Animes Found' })
            res.json(animes);
        });
})
// router for /api/search/episodes?objectid=
router.get('/search/episodes', async (req, res, next) => {
    let objectid = req.query.objectid;
    if (objectid)
        await Episode.find({ _id: objectid }, (err, e) => {
            if (err) return res.status('500').send({ errors: err });
            if (!e) return res.status(404).send({ errors: 'No Episode Found' })
            console.log(e);
            res.json(e);
        });
    else
        await Episode.find({}, (err, episodes) => {
            if (err) return res.status('500').send({ errors: err });
            if (episodes.length == 0) return res.status(404).send({ errors: 'No Episodes Found' })
            res.json(episodes);
        });
})

// post request for /api/request?title=?&siteurl=?
router.post('/request', (req, res, next) => {
    req.data = { siteurl: req.query.siteurl, title: req.query.title }
    res.status(200).send('request sent')
    next();
}, async (req, res, next) => {
    //console.log("Next step")
    if (req.data.siteurl) {
        await main.scrapeURL(req.data.siteurl);
    } else if (req.data.title) {
        // let title = req.param('title')
    }
})

module.exports = router;
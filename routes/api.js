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

function lookupAnime(req, res, next) {

}

// router for /api/search?title=
router.get('/search', async(req, res, next) => {
    let title = req.query.title;
    await Anime.find({ title: title }, (err, animes) => {
        if (err) return res.status('500').send({ errors: err });
        if (animes.length == 0) return res.status(404).send({ errors: 'No Animes Found' })
        res.json(animes);
    });
})


// post request for /api/request?title=?&siteurl=?
router.post('/request', (req, res, next) => {
    req.data = {siteurl: req.query.siteurl, title: req.query.title}
    res.status(200).send('request sent')
    next();
}, async(req, res, next) => {
    //console.log("Next step")
    if (req.data.siteurl) {
        await main.scrapeURL(req.data.siteurl);
    } else if(req.data.title){
       // let title = req.param('title')
    }
})

module.exports = router;
var express = require('express');
let router = express.Router();
const mongoose = require('mongoose')
const Anime = require('../src/schemas/animeSchema.js');

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

router.get('/:animetitle', lookupAnime, (req, res) => {
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

module.exports = router;
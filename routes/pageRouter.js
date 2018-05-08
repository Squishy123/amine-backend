var express = require('express');
let router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {})
});

router.get('/browse', (req, res) => {
    res.render('browse', {})
});

router.get('/animes/:mal_id/:title', (req, res) => {
    res.render('anime', req.params)
});

module.exports = router;

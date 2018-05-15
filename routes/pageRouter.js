var express = require('express');
let router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {})
});

router.get('/search', (req, res) => {
    res.render('search', {})
});

router.get('/search/:keyword', (req, res) => {
    res.render('search', req.params)
})

router.get('/request', (req, res) => {
    res.render('request', {})
});

router.get('/animes/:mal_id/:title', (req, res) => {
    res.render('anime', req.params)
});

router.get('/login', (req, res) => {
    res.render('login', {})
});

router.get('/register', (req, res) => {
    res.render('register', {})
});

module.exports = router;

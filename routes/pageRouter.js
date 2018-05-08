var express = require('express');
let router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {})
});

router.get('/browse', (req, res) => {
    res.render('browse', {})
});


module.exports = router;

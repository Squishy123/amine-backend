var express = require('express');
let router = express.Router();

const Account = require('../schemas/accountSchema.js');

router.get('/register', (req, res) => {
    res.render('register', {})
})

router.post('/register', (req, res, next) => {
    console.log(req.body);
    if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
        Account.create(req.body, function (err, user) {
            if (err) return res.render('error', {message: err.message, status: 401, redirect: {href: '/login', text: 'Login'}})
            req.session.userId = user._id;
            return res.redirect('/account');
        });
    }
});

router.get('/login', (req, res) => {
    res.render('login', {})
});

router.post('/login', (req, res, next) => {
    console.log(req.body);
    if (req.body.username && req.body.password) {
        Account.authenticate(req.body, (err, user) => {
            if (err || !user) {
                return  res.render('error', {message: err.message, status: 401, redirect: {href: '/login', text: 'Login'}})
            }
            req.session.userId = user._id;
            return res.redirect('/account');
        });
    }
});

router.get('/account', (req, res, next) => {
    Account.findById(req.session.userId).exec(function (err, user) {
        if (err) return next(err);
        if (!user) {
            return res.render('error', {message: "You're not logged in", error: {status: "401", stack: " "}});
        } else {
            return res.render('account', { account: user });
        }
    })
});

router.get('/logout', (req, res, next) => {
    if(req.session) {
        //delete session
        req.session.destroy((err) => {
            if(err) return next(err);
            return res.redirect('/');
        })
    }
})

module.exports = router;
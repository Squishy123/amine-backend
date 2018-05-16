const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let AccountSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    passwordConf: {
        type: String,
        required: true
    }
});

AccountSchema.pre('save', function (next) {
    let account = this;
    bcrypt.hash(account.password, 10, function (err, hash) {
        if (err)
            return next(err);
        account.password = hash;
        next();
    });
});

AccountSchema.statics.authenticate = function (query, callback) {
    Account.findOne({username: query.username}).exec(function (err, user) {
        if (err) { return callback(err); }
        else if (!user) {
            let err = new Error('User not found.');
            err.status = 401;
            return callback(err);
        }
        bcrypt.compare(query.password, user.password, function (err, result) {
            if (result)
                return callback(null, user);
            return callback()
        });
    })
}


let Account = mongoose.model('Account', AccountSchema);
module.exports = Account;
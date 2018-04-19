const mongoose = require('mongoose');
const url = "mongodb://localhost:27017/media"
const Anime = require('../schemas/animeSchema.js');

module.exports = {
    addAnime: function (...anime) {
        mongoose.connect(url);
        anime.forEach((a) => {
            a.save((err) => {
                if (err) throw err;
                console.log("Anime saved successfully")
            })
        });
    },
    removeAnime: function (...obj) {
        client.connect(url, (err, db) => {
            if (err) throw err;
            let dbo = db.db('media')
            dbo.collection("animes").deleteMany(obj);
            db.close();
        })
    }
}
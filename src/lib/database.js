const mongoose = require('mongoose');
const url = "mongodb://localhost:27017/media"
const Anime = require('../schemas/animeSchema.js');

module.exports = {
    addAnime: function (...anime) {
    (async() => {
        await mongoose.connect(url);
        await anime.forEach(async (a) => {
            await a.save((err) => {
                if (err) throw err;
                console.log("Anime saved successfully")
            })
        });
           //mongoose.disconnect();
    })();
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
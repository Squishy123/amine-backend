const mongoose = require('mongoose');
const Episode = require('./episodeSchema.js');
const Source = require('./sourceSchema.js');

let AnimeSchema = new mongoose.Schema({
    id: Number,
    title: String,
    english: String,
    synonyms: [String],
    episodes: [Episode.schema],
    score: { type: Number, min: 0, max: 10 },
    type: {
        type: [{
            type: String,
            enum: ["Movie", "TV", "OVA", "Special"],
        }], default: ["TV"]
    },
    status: {
        type: [{
            type: String,
            enum: ['Pending', 'Not yet aired', 'Currently Airing', 'Finished Airing']
        }], default: ['Pending']
    },
    startDate: String,
    endDate: String,
    synopsis: String,
    image: String,
    scrapeDate: Date
})

AnimeSchema.pre('save', function(next) {
    this.scrapeDate = new Date();
    next();
})

/**
 * Find an anime by title
 * @param {String} title 
 * @param {Function} cb 
 */
AnimeSchema.statics.findByTitle = function(title, cb) {
    return this.find({title: new RegExp(title, 'i')}, cb);
}

module.exports = mongoose.model('Anime', AnimeSchema)
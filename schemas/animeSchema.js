const mongoose = require('mongoose');
const Episode = require('./episodeSchema.js');
const Source = require('./sourceSchema.js');

let AnimeSchema = new mongoose.Schema({
    id: Number,
    title: String,
    english: String,
    synonyms: [String],
    episodes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Episode'}],
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

/**AnimeSchema.methods.editThis = function editThis(obj) {
    this = obj;
}**/

AnimeSchema.methods.addEpisode = function addEpisode(episode) {
    this.episodes.push(episode._id);
    console.log("Added Episode")
}

module.exports = mongoose.model('Anime', AnimeSchema)
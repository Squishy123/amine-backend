const mongoose = require('mongoose');
const Source = require('./sourceSchema.js');

let EpisodeSchema = new mongoose.Schema({
    id: Number,
    title: String,
    english: String,
    duration: Number,
    sources: [{player: String, url: String, quality: String}],
})

module.exports = mongoose.model('Episode', EpisodeSchema)
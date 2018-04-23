const mongoose = require('mongoose');

let SourceSchema = new mongoose.Schema({
    rapidvideo: String,
    url: String,
    quality: {
        type:[{
            type: String,
            enum: ["360p", "480p", "720p", "1080p"],
        }], default: ["360p"]
    },
})


module.exports = mongoose.model('Source', SourceSchema)
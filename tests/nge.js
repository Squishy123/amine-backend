const main = require('../tasks/main.js');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

(async () => {
   // let start = new Date();
    mongoose.connect("mongodb://localhost:27017/media").then(() => {
        console.log("Connection to database successful!")
    }).catch(err => console.log(err))
    await main.scrapeURL('https://www4.9anime.is/watch/neon-genesis-evangelion.179m/1ymr0m')
//console.log(`Execution Time: ${new Date() - start}`);
})()

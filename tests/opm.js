let main = require('../tasks/main.js');

(async() => {
    await main.scrape('One Punch Man');
})().then(() => {
    console.log("Completed!");
})
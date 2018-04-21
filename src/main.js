const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

//scrapers
const anime = require('./lib/9anime.js');

//database
const db = require('./lib/database.js');

//schemas
const Anime = require('./schemas/animeSchema.js');
const Episode = require('./schemas/episodeSchema.js');
const Source = require('./schemas/sourceSchema.js');

(async () => {
    let start = new Date();
    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    let sources = await anime.getSourceLinks(page, 'https://www4.9anime.is/watch/tokyo-ghoulre.2yx0/035qr5')
    console.log("Completed Source Link Scrape")
    let title = await page.evaluate(() => {
        return document.querySelector('#main > div > div.widget.player > div.widget-title > h1').innerHTML;
    });
    page.close();

    //anime reference
    let a = new Anime({ title: title });
    await db.addAnime(a);

    let chunks = ((arr, chunkSize) => {
        let results = [];
        while (arr.length) {
            results.push(arr.splice(0, chunkSize))
        }
        return results;
    })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 10));
    let promises = [];
    chunks.forEach((e, i) => {
        console.log(`Loaded Chunk ${i + 1} of ${chunks.length}`)
        promises.push(anime.addChunk(browser, e, i + 1, a));
    });
    await Promise.all(promises).then(() => {
        mongoose.disconnect();
    });
    browser.close();
    console.log(`Execution Time: ${new Date() - start}`);
})()
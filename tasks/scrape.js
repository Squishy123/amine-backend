const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

//scrapers
const scraper = require('../services/scrapers/9anime.js');

//database
const db = require('../services/database.js');

//schemas
const Anime = require('../schemas/animeSchema.js');
const Episode = require('../schemas/episodeSchema.js');
const Source = require('../schemas/sourceSchema.js');

module.exports = {
    scrape: async function (animeTitle) {
        await mongoose.connect("mongodb://localhost:27017/media")
        let start = new Date();
        let browser = await puppeteer.launch({ headless: true });
        let page = await browser.newPage();

        //get the first item for tester
        await page.goto(`https://www4.9anime.is/search?keyword=${animeTitle}`);

        let animeURL = await page.evaluate(() => {
            return document.querySelector('#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(1) > div > a.poster.tooltipstered').href;
        });

        if (animeURL) {
            let sources = await scraper.getSourceLinks(page, animeURL)
            console.log("Completed Source Link Scrape")
            let title = await page.evaluate(() => {
                return document.querySelector('#main > div > div.widget.player > div.widget-title > h1').innerHTML;
            });
            page.close();

            let chunks = ((arr, chunkSize) => {
                let results = [];
                while (arr.length) {
                    results.push(arr.splice(0, chunkSize))
                }
                return results;
            })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 5));
            let promises = [];
            chunks.forEach((e, i) => {
                promises.push((async () => {
                    let files = await scraper.loadChunk(browser, e, i + 1, a)
                    files.forEach((file) => {
                        if (file) {
                            
                            await Anime.findOneAndUpdate({ _id: anime._id }, { $addToSet: { episodes: ep } }, (err) => {
                                if (err) console.log(err);
                                console.log("added episode")
                            })
                        }
                    })

                })());
            });
            await Promise.all(promises).then(() => {
                mongoose.disconnect();
            });
        }
        browser.close();
        console.log(`Execution Time: ${new Date() - start}`);
    }
}

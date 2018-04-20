const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');

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


    let sources = await anime.getSourceLinks(page, 'https://www4.9anime.is/watch/darling-in-the-franxx.rv5n/m4np3p')
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
    })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 10));
    let promises = [];
    chunks.forEach((e, i) => {
        console.log(`Loaded Chunk ${i + 1} of ${chunks.length}`)
        promises.push(anime.loadChunk(browser, e, i + 1));
    });
    let files = await Promise.all(promises);
    console.log(files);
    
    browser.close();
    
    //jsonfile.writeFileSync('../tmp/data.json', [].concat([].concat(...files)), { flag: 'w' });
    let episodes = [].concat(...files);
    episodes = episodes.map(url => {
        let sources = [];
        if(url[0]) sources.push(new Source({url: url[0], quality: "360p"}))
        if(url[1]) sources.push(new Source({url: url[1], quality: "480p"}))
        if(url[2]) sources.push(new Source({url: url[2], quality: "720p"}))
        if(url[3]) sources.push(new Source({url: url[3], quality: "1080p"}))
        return new Episode({sources: sources})
    })
    db.addAnime(new Anime({title: title, episodes: episodes}));

    console.log(`Execution Time: ${new Date() - start}`);
})();
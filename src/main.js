const puppeteer = require('puppeteer');

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

    let chunks = ((arr, chunkSize) => {
        let results = [];
        while (arr.length) {
            results.push(arr.splice(0, chunkSize))
        }
        return results;
    })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 2));
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
        if(url[0]) sources.push(new Source({rapidvideo: url[0].rapidvideo, url: url[0].url, quality: "360p"}))
        if (url[1]) sources.push(new Source({ rapidvideo: url[1].rapidvideo, url: url[1].url, quality: "480p"}))
        if (url[2]) sources.push(new Source({ rapidvideo: url[2].rapidvideo, url: url[2].url, quality: "720p"}))
        if (url[3]) sources.push(new Source({ rapidvideo: url[3].rapidvideo, url: url[3].url, quality: "1080p"}))
        return new Episode({sources: sources})
    })
    db.addAnime(new Anime({title: title, episodes: episodes}));

    console.log(`Execution Time: ${new Date() - start}`);
})();
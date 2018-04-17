const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');

//scrapers
const anime = require('./lib/9anime.js');

//database
const db = require('./lib/database.js');

(async () => {
    let start = new Date();
    let browser = await puppeteer.launch();
    let page = await browser.newPage();


    let sources = await anime.getSourceLinks(page, 'https://www4.9anime.is/watch/one-punch-man.928/q2w2rw')
    console.log("Completed Source Link Scrape")
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
    jsonfile.writeFileSync('../tmp/data.json', [].concat(...files), {flag: 'w'});
    browser.close();

    db.addAnime({Title: "One Punch Man", Eps: [].concat(...files)});

    console.log(`Execution Time: ${new Date() - start}`);
})();
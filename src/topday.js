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

    await page.goto('https://www4.9anime.is/');
    try {
        await page.waitForSelector('#sidebar > div.widget.ranking > div.widget-body > div:nth-child(1)');
    } catch (err) { }

    let list = await page.evaluate(() => {
        let items = [];
        let range = document.querySelector('#sidebar > div.widget.ranking > div.widget-body > div:nth-child(1)').children.length;
        for (let i = 1; i <= range; i++) {
            items.push(document.querySelector(`#sidebar > div.widget.ranking > div.widget-body > div:nth-child(1) > div:nth-child(${i}) > a`).href)
        }
        return items;
    });
    await page.close();
    let promises = []
    list.forEach((e) => {
        promises.push(
            (async () => {
                let p = await browser.newPage();
                let sources = await anime.getSourceLinks(p, e)
                console.log("Completed Source Link Scrape")
                p.close();

                let chunks = ((arr, chunkSize) => {
                    let results = [];
                    while (arr.length) {
                        results.push(arr.splice(0, chunkSize))
                    }
                    return results;
                })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 5));
                let promises = [];
                chunks.forEach((e, i) => {
                    console.log(`Loaded Chunk ${i + 1} of ${chunks.length}`)
                    promises.push(anime.loadChunk(browser, e, i + 1));
                });
                let files = await Promise.all(promises);
                console.log(files);
                jsonfile.writeFileSync('../tmp/data.json', [].concat(...files), { flag: 'w' });

                db.addAnime({ Title: e, Eps: [].concat(...files) });
            })());
    });

    await Promise.all(promises);
    browser.close();
    console.log(`Execution Time: ${new Date() - start}`);
})();
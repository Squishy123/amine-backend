const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');

(async () => {
    let start = new Date();
    //grab source links
    let browser = await puppeteer.launch({
        headless: true
    });
    let page = await browser.newPage();
    let sources = await getSourceLinks(page, 'https://www4.9anime.is/watch/one-piece.ov8/83ox3q')
    page.close();
    browser.close();

    //break the links into chunks
    let chunks = ((arr, chunkSize) => {
        let results = [];
        while (arr.length) {
            results.push(arr.splice(0, chunkSize))
        }
        return results;
    })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 5));

    let promises = []
    //get files divided over chunks
    const pool = createPuppeteerPool({max: 5});
    chunks.forEach((e, i) => {
        pool.use(async(browser) => {
            console.log(`Loaded Chunk ${i + 1} of ${chunks.length}`)
          promises.push(loadChunk(browser, e, i+1));  
        })
    })
    let files = await Promise.all(promises);
    jsonfile.writeFileSync('files.json', [].concat(...files));

    //clear pool
    pool.drain().then(() => pool.clear())
    
    console.log(`Execution Time: ${new Date() - start}`);

})()
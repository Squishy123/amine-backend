const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');

const whitelist = ["aspx",
    "axd",
    "html",
    "js",
    "css",
    "rapidvideo",
    "mp4",
    "video",
    "9anime",
    "disqus"];

const blacklist = ['mc.yandex.ru', 'bebi']

/**
* Gets the rapidvideo player given a 9anime link
 */
async function getRapidVideoPlayer(page, url) {

    //block popups
    await page.evaluateOnNewDocument(() => {
        window.open = () => null;
    });

    await page.goto(url);
    try {
        await page.waitForSelector('#player', { visible: true });
    } catch (err) { }
    await page.click('#player');


    try {
        await page.waitForSelector('#player > iframe');
    } catch (err) { }

    let link = page.evaluate(() => {
        return document.querySelector('#player > iframe').src;
    })
    return link;
}

/**
* Gets the rapidvideo player given a rapidvideo player url
 */
async function getRapidVideoFile(page, url) {
    let links = [];
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        let url = interceptedRequest.url().toString();
        let wl = whitelist.some((e) => {
            return url.includes(e);
        });
        let bl = blacklist.some((e) => {
            return url.includes(e);
        })
        if (wl && !bl) {
            if (url.includes("mp4")) links.push(url);
            interceptedRequest.continue();
        }
        else interceptedRequest.abort();
    });

    await page.goto(url);
    try {
        await page.waitForSelector('#videojs > div.vjs-error-display.vjs-modal-dialog > div', { timeout: 5000 });
    } catch (err) { }

    return [...new Set(links)][0];
}

/**
 * Grabs the links of all episodes on the given source page
 * @param {String} url 
 */
async function getSourceLinks(page, url) {
    await page.goto(url);
    try {
        await page.waitForSelector('#main > div > div.widget.servers > div.widget-body', { timeout: 5000 });
    } catch (err) { }

    let range = await page.evaluate(() => {
        return (document.querySelector('#main > div > div.widget.servers > div.widget-body > div:nth-child(1) > div')) ? document.querySelector('#main > div > div.widget.servers > div.widget-body > div:nth-child(1) > div').children.length : 1;
    });
    let sources = await page.evaluate((range) => {
        let sources = [];
        let servers = document.querySelector('#main > div > div.widget.servers > div.widget-body').children;
        for (let p = 0; p < servers.length; p++) {
            sources.push({ dataName: servers[p].getAttribute('data-name'), sourceList: [] });
            let list;
            for (let r = 0; r < range; r++) {
                if (range == 1) {
                    list = document.querySelector(`#main > div > div.widget.servers > div.widget-body > div:nth-child(${p + 1}) > ul`).children;
                } else {
                    list = document.querySelector(`#main > div > div.widget.servers > div.widget-body > div:nth-child(${p + 1}) > ul:nth-child(${r + 2})`).children;
                }
                for (let l = 0; l < list.length; l++) {
                    sources[p].sourceList.push(list[l].children[0].href);
                }
            }
        }
        return sources;
    }, range);

    return sources;
}
async function grabLink(browser, url) {
    let p = await browser.newPage();
    let player = await getRapidVideoPlayer(p, url);
    let file = await getRapidVideoFile(p, `${player}&q=720p`);
    await p.close();
    return file
}

async function loadChunk(browser, chunk, num) {
    let data = []
    for (let i = 0; i < chunk.length; i++) {
        let file = await grabLink(browser, chunk[i]);
        if (file) {
            data.push(file);
        } else {
            console.log(`Error limit passed: Chunk ${num} error at : ${chunk[i]}`)
            jsonfile.writeFileSync('errlog.json', chunk[i], { flag: 'a' });
        }
        console.log(`${i / chunk.length * 100}% of chunk ${num} completed`)
        jsonfile.writeFileSync('raw.json', file, { flag: 'a' });
        /** 
        await (async function checkFile(errCheck) {
            if (errCheck > 0) {
                if (file) {
                    data.push(file);
                    if (file) console.log(`${i / chunk.length * 100}% of chunk ${num} completed`)
                    jsonfile.writeFileSync('raw.json', file, {flag: 'a'});
                } else {
                    file = await grabLink(browser, chunk[i]);
                    await checkFile(errCheck--);
                }
            } else {
                console.log(`Error limit passed: Chunk ${num} error at : ${chunk[i]}`)
                jsonfile.writeFileSync('errlog.json', chunk[i], {flag: 'a'});
            }
        })(3);*/
    }
    console.log(`Chunk ${num} completed`)
    return data;
}

(async () => {
    let start = new Date();
    let browser = await puppeteer.launch({
        headless: true
        //args: ["--disable-web-security"]
        //executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    });
    let page = await browser.newPage();
    let sources = await getSourceLinks(page, 'https://www4.9anime.is/watch/dragon-ball-super.7jly/k4j9nr')
    console.log("Completed Source Link Scrape")
    page.close();

    let chunks = ((arr, chunkSize) => {
        let results = [];
        while (arr.length) {
            results.push(arr.splice(0, chunkSize))
        }
        return results;
    })(sources[0].sourceList, Math.ceil(sources[0].sourceList.length / 5));
    /** 
    chunks.forEach(c => {
        console.log(c)
    });*/
    let promises = [];
    chunks.forEach((e, i) => {
        console.log(`Loaded Chunk ${i + 1} of ${chunks.length}`)
        promises.push(loadChunk(browser, e, i + 1));
    });
    let files = await Promise.all(promises);
    //let files = await loadChunk(sources[0].sourceList)
    jsonfile.writeFileSync('files.json', [].concat(...files));
    // jsonfile.writeFileSync('files.json', files);
    //sources[0].forEach

    // console.log(file);
    browser.close();
    console.log(`Execution Time: ${new Date() - start}`);
})();
///Import puppeteer
const puppeteer = require('puppeteer');

//Import json file writer
const jsonfile = require('jsonfile');

//Import util lib
const util = require('./util');

//import async lib
const async = require('async');

/**
 * Searches 9anime films by keyword
 * @param {page} page
 * @param {String} query 
 */
async function search(page, query) {
    page.waitForSelector('#main > div > div:nth-child(1) > div.widget-body > div.film-list', { visible: true });
    await blockAds(page, `https://www3.9anime.is/search?keyword=${query}/`);
    await util.search(page, `https://www3.9anime.is/search?keyword=${query}/`, { timeout: 0, waitUntil: "domcontentloaded" });

}

/**
 * Processes search results and returns an array of data
 * @param {page} page 
 * @param {String} query 
 */
async function getSearchResults(page, query) {
    //goto search page
    await search(page, query);
    let numPages = await util.grabHTML(page, '#main > div > div:nth-child(1) > div.widget-body > div.paging-wrapper > form > span.total');
    let searchItems = [];
    if (!numPages) numPages = 1;

    for (let p = 1; p <= numPages; p++) {
        //go to next page
        currentURL = `https://www3.9anime.is/search?keyword=${query}/` + `&page=${p}`;
        page.waitForSelector('#main > div > div:nth-child(1) > div.widget-body > div.film-list', { visible: true });
        await util.search(page, currentURL, { timeout: 0 });

        let listLength = await util.getNumElements(page, '.item');

        //grab img sources
        let img = await util.grabSRC(page, ` a.poster.tooltipstered > img`);
        //grab link sources
        let link = await util.grabHREF(page, `a.name`);
        //grab title
        let title = await util.grabHTML(page, `a.name`);
        //console.log(img);
        for (let i = 1; i <= listLength; i++) {
            let arg = { selector: `#main > div > div:nth-child(1) > div.widget-body > div.film-list > div:nth-child(${i}) > div > a.poster.tooltipstered > div` };
            //grab status
            let status = await page.evaluate((arg) => {
                let data = [];
                $(arg.selector).children('div').each((index, value) => {
                    data.push({ class: $(value).attr('class'), value: $(value).text() });
                });
                return data;
            }, arg);

            // console.log(link)
            if (title[i - 1] && status && img[i - 1] && link[i - 1]) {
                //console.log(`Title: ${title[i - 1]}`);
                searchItems.push({ title: title[i - 1], status: status, img: img[i - 1], link: link[i - 1] });
            }
        }
    }

    return searchItems;
}

/**
 * Grabs the links for episodes of a given url search result
 * @param {String} url 
 */
async function getEpisodeLinks(page, url) {
    await blockAds(page, url);
    //nav to url
    page.waitForSelector('#player', { visible: true });
    await util.search(page, url, { timeout: 0, waitUntil: "domcontentloaded" });
    let sources = [];

    //grab providers and sort them out by name
    let serverProviders = await page.evaluate(() => {
        let tabs = [];
        $('#main > div > div.widget.servers > div.widget-title > span.tabs').children().each(async (index, value) => {
            tabs.push($(value).text());
        });
        return tabs;
    });

    serverProviders.forEach((e) => {
        sources.push({ serverProvider: e });
    });

    //iterate through sources
    for (let s = 1; s <= sources.length; s++) {
        //grab range of eps(they usually come in 50s)
        let range = await page.evaluate(() => {
            let el = $('#main > div > div.widget.servers > div.widget-body > div:nth-child(1) > div');
            return (el.length) ? el.children().length : 1;
        });

        for (let r = 1; r <= range; r++) {
            let episodes = [];
            let listLength = await page.evaluate(() => {
                let el = $('#main > div > div.widget.servers > div.widget-body > div:nth-child(1) > ul');
                return (el.length) ? el.children().length : 0;
            });
            console.log(listLength)
            for (let l = 1; l <= listLength; l++) {
                let eps = await util.grabHREF(page, `#main > div > div.widget.servers > div.widget-body > div:nth-child(${s}) > ul > li:nth-child(${l}) > a`)
                episodes.push(`https://www3.9anime.is${eps}`);
            }
            if (sources[s - 1].episodes) sources[s - 1].episodes = sources[s - 1].episodes.concat(episodes);
            else sources[s - 1].episodes = episodes;
        }
    }
    return sources;
}

/**
 * Returns the url of the video file of the given player
 * @param {Page} page 
 * @param {String} url 
 */
async function getPlayerFile(browser, page, url) {
    page.waitForSelector('#player', { visible: true }).then(() => {
        console.log("Player has appeared")
    });
    //block popups

    await page.evaluateOnNewDocument(() => {
        window.open = () => null;
    });

    //adblock plus get sources
    let links = [];
    let whitelist = ["aspx",
        "axd",
        "html",
        "js",
        "css",
        "rapidvideo",
        "mp4",
        "video",
        "9anime",
        "disqus",
        url.slice(url.length - 6, url.length)];

    //stop loading network crap
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        let request = false;
        whitelist.forEach((e) => {
            let url = interceptedRequest.url().toString();
            if (url.includes(e)) request = true;
            if (url.includes("mp4")) links.push(url);
        })
        if (request) interceptedRequest.continue();
        else interceptedRequest.abort();
    });

    //page.setAdBlockingEnabled();
    //blockAds(page, url);
    await util.search(page, url, { timeout: 0, waitUntil: "domcontentloaded" }).then(() => {
        console.log("Finished searching")
    });

     //add mixed content requests
    await page.evaluate(() => {
        $('head').append('<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">');
    });

    let click = await page.click('#player').then(() => {
        console.log("clicked");
    });
 //await waitForLoad(page);
    await page.waitForNavigation({waitUntil: "networkidle2"}).then(() => {
    console.log("got all links");
    }).catch((err) => {
        console.log(err);
    });

    return [...new Set(links)];
}

async function blockAds(page, url) {
    let whitelist = ["aspx",
        "axd",
        "html",
        "js",
        "css",
        "rapidvideo",
        "mp4",
        "video",
        "9anime",
        "disqus",
        url.slice(url.length - 6, url.length)];

    //stop loading network crap
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        let request = false;
        whitelist.forEach((e) => {
            let url = interceptedRequest.url().toString();
            if (url.includes(e)) request = true;
            if (url.includes("mp4")) console.log(url);
        })
        if (request) interceptedRequest.continue();
        else interceptedRequest.abort();
    });
}

/**
 * Main
 */
async function main() {
    //setup puppeteer browser
    let browser = await puppeteer.launch({
        headless: false,
        args: ["--disable-web-security"],
        devtools: true
        //executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    });

    (async () => {
        let page = await browser.newPage();
        //inject jquery so we can select stuff
        await util.injectjQuery(page);
        //search for title
        let results = await getSearchResults(page, "steins gate");
         jsonfile.writeFileSync('searchResults.json', results);
 
         //grab episode links
         let links = await getEpisodeLinks(page, results[0].link);
         jsonfile.writeFileSync('fileLinks.json', links);


        //let cached = require('./fileLinks.json');
        //grab video file
        let file = await getPlayerFile(browser, page, links[0].episodes[0]);
        jsonfile.writeFileSync('link.json', file);

    })().then(() => {
        //browser.close();
        console.log("Finished Execution");
        //exit code
    })
        .catch((err) => {
            //browser.close();
            //exit with error 
            console.error("Execution unsuccessful: ", err);

        });
}

main();
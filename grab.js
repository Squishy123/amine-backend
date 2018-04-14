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

const blacklist = ['mc.yandex.ru']

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

    return [...new Set(links)];
}

(async () => {
    let browser = await puppeteer.launch({
        headless: false,
        args: ["--disable-web-security"]
        //executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    });
    let page = await browser.newPage();
    let player = await getRapidVideoPlayer(page, 'https://www4.9anime.is/watch/sword-art-online-alternative-gun-gale-online.m7j7/q64v1v');
    let file = await getRapidVideoFile(page, `${player}&q=1080p`);
    console.log(file);
    page.close();
    browser.close();
})();
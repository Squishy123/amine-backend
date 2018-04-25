const puppeteer = require('puppeteer')
const db = require('../database.js');

const properties = require('./properties.js');
const whitelist = properties.whitelist;
const blacklist = properties.blacklist;

module.exports = {
    /**
    * Gets the rapidvideo player given a 9anime link
     */
    getPlayer: async function (page, url) {
        await page.evaluateOnNewDocument(() => {
            window.open = () => null;
        });
        try {
            await page.goto(url, { timeout: 5000 });
        } catch (err) { }
        try {
            await page.waitForSelector('#player', { visible: true });
        } catch (err) { }
        await page.click('#player');
        try {
            await page.waitForSelector('#player > iframe');
        } catch (err) { }
        let player = page.evaluate(() => {
            return document.querySelector('#player > iframe').src;
        })
        return player;
    },

    /**
    * Gets the rapidvideo player given a rapidvideo player url
     */
    getVideo: async function (page, url) {
        let links = [];
        await page.setRequestInterception(true);
        let intercept = (interceptedRequest) => {
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
        }
        page.on('request', intercept);
        try {
            await page.goto(url, { timeout: 5000 });
        } catch (err) { }
        try {
            await page.waitForSelector('#videojs > div.vjs-error-display.vjs-modal-dialog > div', { timeout: 5000 });
        } catch (err) { }
        page.removeListener('request', intercept)
        return [...new Set(links)][0];
    },

    /**
     * Grabs the links of all episodes on the given source page
     * @param {String} url 
     */
    getSource: async function (page, url) {
        try {
            await page.goto(url, { timeout: 5000 , waitUntil: ["domcontentloaded"]});
        } catch (err) { }
        try {
            await page.waitForSelector('#main > div > div.widget.servers > div.widget-body', { timeout: 5000 });
        } catch (err) { }

        let range = await page.evaluate(() => {
            return (document.querySelector('#main > div > div.widget.servers > div.widget-body > div:nth-child(1) > div')) ? document.querySelector('#main > div > div.widget.servers > div.widget-body > div:nth-child(1) > div').children.length : 1;
        });
        let sources = await page.evaluate((range) => {
            let sources = [];
            let servers = document.querySelector('#main > div > div.widget.servers > div.widget-body').children;
            let list;
            for (let r = 1; r <= range; r++) {
                if (range == 1) {
                    list = document.querySelector(`#main > div > div.widget.servers > div.widget-body > div:nth-child(${2}) > ul`).children;
                } else {

                    list = document.querySelector(`#main > div > div.widget.servers > div.widget-body > div:nth-child(${2}) > ul:nth-child(${r + 1})`).children;
                }
                for (let l = 0; l < list.length; l++) {
                    sources.push({ href: list[l].children[0].href, index: list[l].children[0].getAttribute('data-base') });
                }
            }
            return sources;
        }, range);

        return sources;
    },
    grabLink: async function (page, url, query) {
        let player = await this.getRapidVideoPlayer(page, url);
        let file = await this.getRapidVideoFile(page, `${player}${query}`);
        return { rapidvideo: player, url: file, quality: query }
    }
}
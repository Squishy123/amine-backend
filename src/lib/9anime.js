const puppeteer = require('puppeteer');

const properties = require('./properties.js');
const whitelist = properties.whitelist;
const blacklist = properties.blacklist;

module.exports = {
    /**
    * Gets the rapidvideo player given a 9anime link
     */
    getRapidVideoPlayer: async function (page, url) {

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
    },

    /**
    * Gets the rapidvideo player given a rapidvideo player url
     */
    getRapidVideoFile: async function (page, url) {
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
    },

    /**
     * Grabs the links of all episodes on the given source page
     * @param {String} url 
     */
    getSourceLinks: async function (page, url) {
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
    },
    grabLink: async function (browser, url, query) {
        let p = await browser.newPage();
        let player = await this.getRapidVideoPlayer(p, url);
        let file = await this.getRapidVideoFile(p, `${player}${query}`);
        await p.close();
        return {rapidvideo: url, url: file}
    }
    ,
    loadChunk: async function (browser, chunk, num) {
        let data = []
        for (let i = 0; i < chunk.length; i++) {
            let file = [];
            file[0] = await this.grabLink(browser, chunk[i], '&q=360p');
            file[1] = await this.grabLink(browser, chunk[i], '&q=480p');
            file[2] = await this.grabLink(browser, chunk[i], '&q=720p');
            file[3] = await this.grabLink(browser, chunk[i], '&q=1080p');
            if (file) {
                data.push(file);
                console.log(`${i / chunk.length * 100}% of chunk ${num} completed`)
                //jsonfile.writeFileSync('../../tmp/raw.json', file, { flag: 'a' });
            } else {
                console.log(`Error limit passed: Chunk ${num} error at : ${chunk[i]}`)
                //jsonfile.writeFileSync('../../tmp/errlog.json', chunk[i], { flag: 'a' });
                return;
            }
        }
        console.log(`Chunk ${num} completed`)
        return data;
    }
}
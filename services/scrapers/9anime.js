const puppeteer = require('puppeteer')
const db = require('../database.js');

//schemas
const Anime = require('../../schemas/animeSchema.js');
const Episode = require('../../schemas/episodeSchema.js');
const Source = require('../../schemas/sourceSchema.js');

const properties = require('./properties.js');
const whitelist = properties.whitelist;
const blacklist = properties.blacklist;

module.exports = {
    /**
     * Divide an array into chunks of a given size
     */
    createChunks: function(arr, chunkSize) {
        let results = [];
        while (arr.length) {
            results.push(arr.splice(0, chunkSize))
        }
        return results;
    },
    /**
    * Gets the rapidvideo player given a 9anime link
     */
    getRapidVideoPlayer: async function (page, url) {
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
        let player = page.evaluate(() => {
            return document.querySelector('#player > iframe').src;
        })
        return player;
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
                        sources[p].sourceList.push({href: list[l].children[0].href, index: list[l].children[0].getAttribute('data-base')});
                    }
                }
            }
            return sources;
        }, range);

        return sources;
    },
    grabLink: async function (page, url, query) {
        let player = await this.getRapidVideoPlayer(page, url);
        let file = await this.getRapidVideoFile(page, `${player}${query}`);
        return { rapidvideo: player, url: file, quality: query}
    },

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
            } else {
                console.log(`Error limit passed: Chunk ${num} error at : ${chunk[i]}`)
                return;
            }
        }
        console.log(`Chunk ${num} completed`)
        return data;
    },
    //Adds the chunk to a database at a index
    addChunk: async function (browser, chunk, num, anime) {
        for (let i = 0; i < chunk.length; i++) {
            let file = [];
            file[0] = await this.grabLink(browser, chunk[i].href, '&q=360p');
            file[1] = await this.grabLink(browser, chunk[i].href, '&q=480p');
            file[2] = await this.grabLink(browser, chunk[i].href, '&q=720p');
            file[3] = await this.grabLink(browser, chunk[i].href, '&q=1080p');
            if (file) {
                let sources = [];
                file.forEach((link) => {
                    if (link) sources.push(new Source({ rapidvideo: link.rapidvideo, url: link.url, quality: link.quality }))
                });
                let ep = new Episode({ id: chunk[i].index, sources: sources })
                console.log(ep);
                await Anime.findOneAndUpdate({ _id: anime._id }, { $addToSet: { episodes: ep } }, (err) => {
                    if (err) console.log(err);
                    console.log("Success!")
                });
                console.log(`${i / chunk.length * 100}% of chunk ${num} completed`)
            } else {
                console.log(`Error limit passed: Chunk ${num} error at : ${chunk[i]}`)
                return;
            }
        }
        console.log(`Chunk ${num} completed`)
    }
}
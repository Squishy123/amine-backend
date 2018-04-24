const { expect } = require('chai');
const puppeteer = require('puppeteer')
const scrape = require('../services/scrapers/9anime.js')

const [whitelist, blacklist] = [require('../services/scrapers/properties').whitelist, require('../services/scrapers/properties').blacklist]

describe('Scraping Tests', () => {
    let browser, page;

    before(async () => {
        browser = await puppeteer.launch({
            headless: false
        })
        page = await browser.newPage()
    })

    afterEach(async () => {
        await page.close()
    })

    after(async () => {
        await browser.close()
    })

    it('Scrape OPM - Single Threaded', async (done) => {
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
                interceptedRequest.continue();
            }
            else interceptedRequest.abort();
        });
        let result = []
        let sources = await scrape.getSourceLinks(page, 'https://www4.9anime.is/watch/one-punch-man.928/q2w2rw')
        await sources[0].sourceList.forEach(async (src) => {
            console.log(src);
            await (async ()=> {
                let player = await scrape.getRapidVideoPlayer(page, src)
                let link = await scrape.getRapidVideoFile(page, player, '&q=1080p')
                result.push(link);
            })()
        })
        expect(result).to.have.length(12)
        done()
    }).timeout(10000000)


})
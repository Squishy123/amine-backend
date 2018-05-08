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

    it('Scrape OPM - Single Threaded', async () => {
        await scrape.scrapTitle("one punch man")
    })
    expect(result).to.have.length(12)
})

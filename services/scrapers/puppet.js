const puppeteer = require('puppeteer')
class Puppet {
    /**
     * Create a new puppet object set the fields to optional params
     * @param {browser} browser 
     * @param {id: id, page: page} pages 
     */
    constructor(id, browser, pages) {
        this.id = id || null;
        this.browser = browser || null;
        this.pages = pages || [];
    }

    /**
     * Create a new browser instance with given flags
     * @param {args} flags
     */
    async init(flags) {
        let browser = await puppeteer.launch(flags);
        this.browser = browser;
        return browser;
    }

    /**
     * Close up all pages and browser
     */
    async close() {
        let pageClose = []
        this.pages.forEach((e) => {
            pageClose.push((async() => {await e.close()})());
        })
        await Promise.all(pageClose);
        await  this.browser.close();
    }

    /**
     * Add a new page to puppet object and return the page
     * {id: passedID, page: pageReference}
     * @param {String} id
     */
    async addPage(id) {
        let page = await this.browser.newPage();
        this.pages.push({ id: id, page: page });

        return page;
    }

    /**
     * Remove and close a page of a given id
     * @param {String} id 
     */
    async removePage(id) {
        let pageIndex = this.pages.findIndex((e) => {
            return e.id = id;
        });
        await pages[pageIndex].close();
        this.pages.splice(pageIndex, 1);
     }
}

class PuppetMaster {
    constructor() {

    }

    async addBrowser(id, flags) {
        let puppet = new Puppet(id);
        await puppet.init(flags);
        this.puppets.push(puppet);
    }

    async addPage(puppet) {
        let page = await browser.newPage();
        this.pages.push(page);

        return page;
    }
}
const puppeteer = require('puppeteer')
class Puppet {
    /**
     * Create a new puppet object set the fields to optional params
     * @param {browser} browser 
     * @param {id: id, page: page} pages 
     */
    constructor(browser, pages) {
        this.browser = browser;
        this.pages = pages || [];
    }
}

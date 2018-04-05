/**
 * Util class with helpful methods
 */
module.exports = {
    /**
     * Navigate to search url, waits for selector to appear
     * @param {page} page
     * @param {String} url
     */
    search: async function (page, url, options) {
        await page.goto(url, options);
    },

    /**
     * Returns the number of elements with the same selector
     * @param {page} page 
     * @param {String} selector 
     */
    getNumElements: async function (page, selector) {
        let arg = { selector: selector };
        let scraper = (arg) => {
            return $(arg.selector).length;
        }
        try {
            return await page.evaluate(scraper, arg);
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    /**
     * Returns the src property of  element of given selector
     */
    grabSRC: async function (page, selector) {
        let numElements = await this.getNumElements(page, selector);
        if (numElements > 1) {
            let arg = { selector: selector };
            let scraper = (arg) => {
                let src = [];
                let el = $(arg.selector);
                el.each((index, value) => {
                    src.push($(value).attr('src'));
                });
                return src;
            }
            try {
                return await page.evaluate(scraper, arg);
            } catch (err) {
                console.error("Can't grab src", err);
                return null;
            }
        } else if (numElements == 1) {
            let arg = { selector: selector };
            let scraper = (arg) => {
                return $((arg.selector).attr('src'));
            }
            try {
                return await page.evaluate(scraper, arg);
            } catch (err) {
                console.error(err);
                return null;
            }
        }

    },

    /**
   * Returns the href property of element of given selector
   */
    grabHREF: async function (page, selector) {
        let numElements = await this.getNumElements(page, selector);
        if (numElements > 1) {
            let arg = { selector: selector };
            let scraper = (arg) => {
                let href = [];
                let el = $(arg.selector);
                el.each((index, value) => {
                    href.push($(value).attr('href'));
                });
                return (href);
            }
            try {
                return await page.evaluate(scraper, arg);
            } catch (err) {
                console.error("Can't grab href", err);
                return null;
            }
        } else if (numElements == 1) {
            let arg = { selector: selector };
            let scraper = (arg) => {
                return ($(arg.selector).attr('href'));
            }
            try {
                return await page.evaluate(scraper, arg);
            } catch (err) {
                console.error("Can't grab href", err);
                return null;
            }
        }

    },

    /**
    * Returns the innerHTML property of element of given selector
    */
    grabHTML: async function (page, selector) {
        let numElements = await this.getNumElements(page, selector);
        if (numElements > 1) {
            let arg = { selector: selector };
            let scraper = (arg) => {
                let html = [];
                let el = $(arg.selector);
                el.each((index, value) => {
                    html.push($(value).html());
                });
                return (html);
            }
            try {
                return await page.evaluate(scraper, arg);
            } catch (err) {
                console.error("Can't grab html", err);
                return null;
            }
        } else if (numElements === 1) {
            let arg = { selector: selector };
            let scraper = (arg) => {
                return ($(arg.selector).html());
            }
            try {
                return await page.evaluate(scraper, arg);
            } catch (err) {
                console.error("Can't grab html", err);
                return null;
            }
        }

    },

    /**
     * Injects jQuery 3.3.1 into page 
     */
    injectjQuery: async function (page) {
        try {
            await page.addScriptTag({ url: "https://code.jquery.com/jquery-3.3.1.min.js" });
            console.log("jQuery successfully injected");
        } catch (err) {
            console.error(err, "Could not inject jQuery");
        }
    },

    /**
     * Saves screenshot into folder, labelled with current date
     */
    logScreenshot: async function (page, path) {
        try {
            await page.screenshot(path);
            console.log("Screenshot successfully taken");
        } catch (err) {
            console.error(err, "Could not take screenshot");
        }
    }
};
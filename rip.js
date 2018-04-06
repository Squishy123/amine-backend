const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const jsonfile = require('jsonfile');

const MAX_TABS = 10;

async function main() {
    let browser = await puppeteer.launch({
        headless: false
    });

    (async () => {
        //a-z list
        let list = [];

        let listLength = await (async () => {
            let page = await browser.newPage();
            page.waitForSelector('span.total', { visible: true });
            await page.goto('https://www4.9anime.is/az-list', { waituntil: 'domcontentload' });
            let $ = cheerio.load(page.content());
            let num = Number($('span.total').html());
            return num;
        })();
        console.log(listLength);


        for (let i = 1; i <= 299; i++) {
            (async () => {
                let page = await browser.newPage();
                //page.waitForSelector('#main > div > div > div.widget-body > div.items', { visible: true });
                await page.goto(`https://www4.9anime.is/az-list?page=${i}`, { waituntil: 'domcontentload' });
                let mini = await page.evaluate((arg) => {
                    let x = [];
                    /*
                    let $ = cheerio.load(page.content());
                    let items = $('#main > div > div > div.widget-body > div.items').children().each((index, value) => {
                        x.append(value.html());
                    });*/
                    let children = document.querySelector('#main > div > div > div.widget-body > div.items').children;
                    for (let c = 0; c < children; c++) {
                        x.append(children[c].innerHTML);
                    }
                    return x;
                });
                list[i] = mini;
                page.close();
            })();
        }
        /*
        async function getItems(p) {
            let page = await browser.newPage();
            //page.waitForSelector('#main > div > div > div.widget-body > div.items', { visible: true });
            await page.goto(`https://www4.9anime.is/az-list?page=${p}`, { waituntil: 'domcontentload' });
            let $ = cheerio.load(page.content());
            let items = $('#main > div > div > div.widget-body > div.items').children('div.items').each((index, value) => {
                list[p].append(value);
                console.log(value);
            });
            page.close();
        }

        async function checkTabs(browser, n) {
            let bp = await browser.pages().length;
            if (bp < MAX_TABS) {
                if (n > 1)
                    getItems(n--);
            } else await checkTabs(browser, n);
        }

        getItems(n).then(checkTabs(browser, n));
*/
        console.log(list);
        jsonfile.writeFileSync('results.json', list);
    })().then(async () => {
        await browser.close();
        console.log("Finished Execution");

        //exit code
    })
        .catch(async (err) => {
            //exit with error 
            await browser.close();
            console.error("Execution unsuccessful: ", err);


        });
}
main();


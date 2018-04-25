const async = require('async')
const puppeteer = require('puppeteer');
const scrape = require('../services/scrapers/9anime.js');

const threads = 5;

(async () => {
    let browser = await puppeteer.launch();
    /* let pages = [];
     for(let i = 0; i < threads; i++) {
      pages.push((async() => {return await browser.newPage()})());
     }
     pages = Promise.all(pages);
     */
    let page = await browser.newPage();
    let sources = await scrape.getSource(page, "https://www4.9anime.is/watch/dragon-ball-super.7jly/k4j9nr");
    //console.log(sources);

    let puppet = async.queue(async (task, callback) => {
        //console.log("queued a task")
        await task.func.apply(null, task.args)
        callback();
    }, 2)

    puppet.saturated = () => {
        console.log("Waiting for current tasks to complete...")
    }

    puppet.drain = async () => {
        console.log("All tasks completed!")
        await browser.close();
    }

    await page.close();

    async function package(url) {
        let p = await browser.newPage();
        let player = await scrape.getPlayer(p, url);
        //console.log(player);
        let video = await scrape.getVideo(p, `${player}&q=720p`);
        console.log(video);
        await p.close();
    }
    
    async.each(sources, (s, c) => {
        puppet.push({ func: package, args: [s.href] }, () => { console.log("Completed task!") })
    });
})()
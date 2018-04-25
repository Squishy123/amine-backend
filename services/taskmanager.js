const mongoose = require('mongoose')
const puppeteer = require('puppeteer')
const scrape = require('./scrapers/9anime.js')

function queue(concurrency) {

    let running = 0;
    let taskQueue = [];

    function runTask(task) {
        running++;
        task(() => {
            running--
            if (taskQueue.length > 0)
                runTask(taskQueue.shift())
        })
    }

    function enqueueTask(task) {
        taskQueue.push(task)
    }

    return {
        push: (task) => {
            if (running < concurrency) runTask(task);
            else enqueue(task);
        }
    }
}



    (async () => {
        //puppeteer stuff
        let browser = await puppeteer.launch({ headless: false });
        let promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(browser.newPage())
        }
        let pages = await Promise.all(promises);

        let taskRunner = queue(5);

        let task = function (fun) {
            return (async () => {   
                fun();
            })();
        }

        async function grab(url) {
            let page = pages.pop();
            await scrape.getSourceLinks(page, url)
            pages.push(page);
        }


        for (let i = 0; i < 100; i++) {
            let fun = grab("https://www4.9anime.is/watch/tokyo-ghoulre-dub.l97z/237944");
            taskRunner.push(task(fun))
        }
})()


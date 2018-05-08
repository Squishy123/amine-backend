const async = require('async')
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const scrape = require('../services/scrapers/9anime.js');

//scrapers
const anime = require('../services/scrapers/9anime.js');

//database
const db = require('../services/database.js');

//schemas
const Anime = require('../schemas/animeSchema.js');
const Episode = require('../schemas/episodeSchema.js');

const threads = 8;

module.exports = {
    scrapeURL: async (url) => {
        let start = new Date();
        /*
        await mongoose.connect("mongodb://localhost:27017/media").then(() => {
            console.log("Connection to database successful!")
        }).catch(err => console.log(err))*/

        let browser = await puppeteer.launch();
        let page = await browser.newPage();
        let sources = await scrape.getSource(page, url);

        let title = await page.evaluate(() => {
            return document.querySelector('#main > div > div.widget.player > div.widget-title > h1').innerHTML;
        });
        await page.close();

        await Anime.findOne({ title: title }, (err, a) => {
            if (a) {
                let an = a;
            } else {
                let an = new Anime({ title: title });
                an.save((err) => {
                    if (err) console.log(err);
                    console.log("Saved Anime Successfully!")
                });
                let numTask = 0;

                let puppet = async.queue(async (task, callback) => {
                    //console.log("queued a task")
                    numTask++;
                    console.log(`task: ${numTask}`)
                    await task.func.apply(null, task.args)
                    callback();
                }, threads)

                puppet.saturated = () => {
                    console.log("Waiting for current tasks to complete...")
                }

                puppet.drain = () => {
                    console.log("All tasks completed!");
                    (async () => {
                        await browser.close();
                        //await mongoose.disconnect();
                    })();
                    console.log(`Execution Completed: ${new Date()-start}ms`);
                }

                async function package(url, index) {
                    //  let pages = await Promise.all([browser.newPage(), browser.newPage(), browser.newPage(), browser.newPage()])
                    //   let player = await scrape.getPlayer(pages[0], url);
                    /*let videos = await Promise.all([scrape.getVideo(pages[0], `${player}&q=360p`), scrape.getVideo(pages[1], `${player}&q=480p`), scrape.getVideo(pages[2], `${player}&q=720p`), scrape.getVideo(pages[3], `${player}&q=1080p`)])
                    let sources = [];
                    if (videos[0])
                        sources.push({ player: `${player}&q=360p`, quality: "360p", url: videos[0] })
                    if (videos[1])
                        sources.push({ player: `${player}&q=480p`, quality: "480p", url: videos[1] })
                    if (videos[2])
                        sources.push({ player: `${player}&q=720p`, quality: "720p", url: videos[2] })
                    if (videos[3])
                        sources.push({ player: `${player}&q=1080p`, quality: "1080p", url: videos[3] })*/
                    let page = await browser.newPage();
                    let player = await scrape.getPlayer(page, url);
                    let sources = [];
                    sources.push({ player: `${player}&q=360p`, quality: "360p" })
                    sources.push({ player: `${player}&q=480p`, quality: "480p" })
                    sources.push({ player: `${player}&q=720p`, quality: "720p" })
                    sources.push({ player: `${player}&q=1080p`, quality: "1080p" })

                    let ep = new Episode({ id: index, sources: sources })
                    await ep.save((err) => {
                        if (err) console.log(err);
                        console.log("Saved Episode Successfully!")
                    });
                    await Anime.findOneAndUpdate({ _id: an._id }, { $addToSet: { episodes: ep } }, (err) => {
                        if (err) console.log(err)
                    });
                    await an.save();
                    await Anime.findOne({ title: an.title })
                        .populate('episodes')
                        .exec((err, a) => {
                            if (err) console.log(err);
                        })
                    await page.close();
                    // await Promise.all([pages[0].close(), pages[1].close(), pages[2].close(), pages[3].close()]);
                }

                async.each(sources, (s) => {
                    puppet.push({ func: package, args: [s.href, s.index] }, () => { console.log("Completed task!") })
                });
            }
        });
    }
}

const async = require('async')
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const scrape = require('../services/scrapers/9anime.js');

const Anime = require('../schemas/animeSchema.js');
const Episode = require('../schemas/episodeSchema.js');

const threads = 4;

module.exports = {
    scrapeURL: async (url) => {
        await mongoose.connect("mongodb://localhost:27017/media").then(() => {
            console.log("Connection to database successful!")
        }).catch(err => console.log(err))

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
                        await mongoose.disconnect();
                    })();
                }

                async function package(url, index) {
                    let p = await browser.newPage();
                    let player = await scrape.getPlayer(p, url);
                    let video = await scrape.getVideo(p, `${player}&q=720p`);
                    let ep = new Episode({ id: index, sources: [{ player: player, quality: "720p", url: video }] })
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
                    await p.close();
                }

                async.each(sources, (s) => {
                    puppet.push({ func: package, args: [s.href, s.index] }, () => { console.log("Completed task!") })
                });
            }
        });
    }
}

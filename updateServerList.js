const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');

request('https://nordvpn.com/ovpn/', (err, res, html) => {
    let $ = cheerio.load(html);
    let servers = [];
    $('body > div.Article > div > div > div > div > div > ul').find('span.mr-2').each((i, e) => {
        servers.push($(e).text());
    });

    servers = JSON.stringify(servers);
    fs.writeFileSync('./proxylist.json', servers, {encoding: 'utf-8', flag: 'w'})
});
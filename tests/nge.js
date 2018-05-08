const main = require('../tasks/main.js');

async function test() {
    let start = new Date();
    await main.scrape('Neon Genesis Evangelion')
    console.log(`Execution Time: ${new Date() - start}`);
}

test();
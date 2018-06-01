async function getTrending() {
    let items = await fetch(`https://kitsu.io/api/edge/trending/anime`).then((res) => {
        return res.json();
    });
    return items;
}

async function getSearch(meta) {
    let anime = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${meta.query}`).then((res) => {
        return res.json();
    });
    console.log(anime);
    return anime;
}

async function getAnime(meta) {
    let anime = await fetch(`https://kitsu.io/api/edge/anime/${meta.id}`).then((res) => {
        return res.json();
    });
    console.log(anime);
    return anime;
}
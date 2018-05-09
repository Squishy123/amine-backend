async function getTopItems(meta) {
    let items = await fetch(`https://api.jikan.moe/top/${meta.type}/${meta.page}/${meta.subtype}`).then((res) => {
        return res.json();
    });
    return items;
}

async function getSearch(meta) {
    let anime = await fetch(`https://api.jikan.moe/search/anime/${meta.query}/${meta.page}`).then((res) => {
        return res.json();
    });
    return anime;
}

async function getAnime(meta) {
    let anime = await fetch(`https://api.jikan.moe/anime/${meta.id}`).then((res) => {
        return res.json();
    });
    return anime;
}
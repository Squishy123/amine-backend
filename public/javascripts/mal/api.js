async function getTopItems(meta) {
    let items = await fetch(`https://api.jikan.moe/top/${meta.type}/${meta.page}/${meta.subtype}`).then((res) => {
        return res.json();
    });
    return items;
}
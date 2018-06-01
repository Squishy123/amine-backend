//display the top 50 animes
(async () => {
    let browse = document.querySelector('#browse');
    let items = await getTrending()
    for (let i = 0; i < items.data.length; i += 4) {
        //create a new row and append it to container
        let row = document.createElement('div');
        row.className = "row";
        browse.appendChild(row);
        let it = items.data.slice(i, i + 4);
        it.forEach(e => {
            let col = document.createElement('div');
            col.className = "col-md-3";
            let card = document.createElement('div');
            card.className = "card animeItem";
            card.innerHTML = `<img class="card-img-top" src="${e.attributes.posterImage.medium}" alt="Poster">
            <div class="card-body">
            <h5 class="card-title">${e.attributes.canonicalTitle}</h5>
            <a href="/animes/${e.id}/${e.attributes.canonicalTitle}" class="btn btn-primary">Watch Now</a>
            </div>`;
            col.appendChild(card);
            row.appendChild(col);
        });
    }
})()
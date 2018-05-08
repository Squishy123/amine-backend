//display the top 50 animes
(async () => {
    let browse = document.querySelector('#browse');
    let items = await getTopItems({ type: 'anime', page: 1, subtype: 'bypopularity' })
    for (let i = 0; i < items.top.length; i += 4) {
        //create a new row and append it to container
        let row = document.createElement('div');
        row.className = "row";
        browse.appendChild(row);
        let it = items.top.slice(i, i + 4);
        it.forEach(e => {
            let col = document.createElement('div');
            col.className = "col-md-3";
            let card = document.createElement('div');
            card.className = "card animeItem";
            card.innerHTML = `<img class="card-img-top" src="${e.image_url}" alt="Poster">
            <div class="card-body">
            <h5 class="card-title">${e.title}</h5>
            <a href="#" class="btn btn-primary">Watch Now</a>
            </div>`;
            col.appendChild(card);
            row.appendChild(col);
        });
    }
})()
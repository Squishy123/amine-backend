const socket = io('http://localhost:3000/api');

socket.on('search: result', (res) => {
    document.querySelector('#results').innerHTML += `<p>${res}</p>`
});

async function search() {
    let inp = document.querySelector('#input');
    let results = document.querySelector('#results');
    results.innerHTML = ""

    let res = await getSearch({query: inp.value, page: 1})
    inp.value = "";

    for (let i = 0; i < res.result.length; i += 4) {
        //create a new row and append it to container
        let row = document.createElement('div');
        row.className = "row";
        results.appendChild(row);
        let it = res.result.slice(i, i + 4);
        it.forEach(e => {
            let col = document.createElement('div');
            col.className = "col-md-3";
            let card = document.createElement('div');
            card.className = "card animeItem";
            card.innerHTML = `<img class="card-img-top" src="${e.image_url}" alt="Poster">
            <div class="card-body">
            <h5 class="card-title">${e.title}</h5>
            <a href="/animes/${e.mal_id}/${e.title}" class="btn btn-primary">Watch Now</a>
            </div>`;
            col.appendChild(card);
            row.appendChild(col);
        });
    }
    

    //socket.emit('search: query', inp.value);
}


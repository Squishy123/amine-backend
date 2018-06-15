const api = (window.location.href.includes('localhost')) ? io('http://localhost/api') : (window.location.href.includes('192.168.2.42')) ? io('http://192.168.2.42/api') : io('http://protoamine.tk/api');

api.on('search: result', (res) => {
    document.querySelector('#results').innerHTML += `<p>${res}</p>`
});

function redirect() {
    let inp = document.querySelector('#input');
    console.log(inp.value);
    window.location.href = `/search/${inp.value}`;
}

async function search(inp) {
    let res = await getSearch({ query: inp})
    document.querySelector('#results').removeChild(document.querySelector('#loader'));
    for (let i = 0; i < res.data.length; i += 4) {
        //create a new row and append it to container
        let row = document.createElement('div');
        row.className = "row";
        results.appendChild(row);
        let it = res.data.slice(i, i + 4);
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


    //socket.emit('search: query', inp.value);
}



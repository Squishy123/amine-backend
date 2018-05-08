const socket = io('http://localhost:3000/api');

socket.on('search: result', (res) => {
    document.querySelector('#results').innerHTML += `<p>${res}</p>`
});

function search() {
    let inp = document.querySelector('#input');
    socket.emit('search: query', inp.value);
    inp.value = "";
}


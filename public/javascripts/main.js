function scrapeAnime() {
    let query = document.querySelector('body > div:nth-child(3) > div > form > input').innerHTML
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://localhost:3000', true);

    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {//Call a function when the state changes.
        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            document.querySelector("#alerts").innerHTML += `<div class="alert alert-primary" role="alert">Scrape complete</div>`
        }
    }
    xhr.send(query);
}
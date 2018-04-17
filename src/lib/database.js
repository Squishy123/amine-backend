const mongo = require('mongodb');
const client = mongo.MongoClient;
const url = "mongodb://localhost:27017/"

module.exports = {
    addAnime: function (obj) {
        client.connect(url, (err, db) => {
            if (err) throw err;
           let dbo = db.db('amine')
           dbo.collection("animes").insertOne(obj);
            db.close();
        })
        
    }
}
const mongoose = require('mongoose');

let TaskSchema = new mongoose.Schema({
});


module.exports = mongoose.model('Task', TaskSchema)
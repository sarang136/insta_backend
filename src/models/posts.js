
const mongoose = require('mongoose')

const postsSchema = new mongoose.Schema({
    onUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    posts: [{
        type: String,
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    }]
})

module.exports = mongoose.model('posts', postsSchema);
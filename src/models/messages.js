const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    attachments: [{ type: String }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 })

module.exports = mongoose.model('Message', messageSchema)



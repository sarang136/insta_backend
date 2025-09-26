const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { userAuth } = require('../middlewares/auth');
const Message = require('../models/messages');
const ConnectionRequest = require('../models/connectionRequests');

router.get('/messages/:userId', userAuth, async (req, res) => {
  try {
    const otherUserId = req.params.userId
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
    const before = req.query.before ? new Date(req.query.before) : null
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid userId' })
    }
    const userId = req.user._id
    const filter = {
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ]
    }
    if (before) {
      filter.createdAt = { $lt: before }
    }
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
    res.json({ data: messages.reverse() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/messages/:userId/read', userAuth, async (req, res) => {
  try {
    const otherUserId = req.params.userId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid userId' })
    }
    const userId = req.user._id
    const result = await Message.updateMany(
      { sender: otherUserId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    )
    res.json({ modified: result.modifiedCount || result.nModified || 0 })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Conversations summary: connections with last message and unread count
router.get('/conversations', userAuth, async (req, res) => {
  try {
    const userId = req.user._id
    // fetch accepted connections
    const connections = await ConnectionRequest.find({
      $or: [
        { toUserId: userId, status: 'accepted' },
        { fromUserId: userId, status: 'accepted' },
      ]
    })
      .populate('fromUserId', ['firstName','secondName','profileImage'])
      .populate('toUserId', ['firstName','secondName','profileImage'])

    const peers = connections.map((c) => c.fromUserId._id.equals(userId) ? c.toUserId : c.fromUserId)

    // build summaries in parallel
    const summaries = await Promise.all(peers.map(async (peer) => {
      const last = await Message.findOne({
        $or: [
          { sender: userId, receiver: peer._id },
          { sender: peer._id, receiver: userId },
        ]
      }).sort({ createdAt: -1 })

      const unread = await Message.countDocuments({ sender: peer._id, receiver: userId, isRead: false })

      return {
        peer: {
          _id: peer._id,
          firstName: peer.firstName,
          secondName: peer.secondName,
          profileImage: peer.profileImage,
        },
        lastMessage: last ? {
          _id: last._id,
          text: last.text,
          createdAt: last.createdAt,
          sender: String(last.sender),
          receiver: String(last.receiver),
        } : null,
        unreadCount: unread,
      }
    }))

    // sort by lastMessage time desc (nulls last)
    summaries.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    })

    res.json({ data: summaries })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router



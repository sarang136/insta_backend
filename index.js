
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const { connectDb } = require('./src/configs/database');
const cookieParser = require('cookie-parser')
const authRouter = require('./src/routes/auth');
const requestRouter = require('./src/routes/requests');
const profileRouter = require('./src/routes/profile');
const userRouter = require('./src/routes/user');
const chatRouter = require('./src/routes/chat');
const cors = require('cors');
const { Server } = require('socket.io');
const Message = require('./src/models/messages');

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || "*");
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(cookieParser())

app.use('/', authRouter);
app.use('/', requestRouter);
app.use('/', profileRouter)
app.use('/', userRouter)
app.use('/', chatRouter)

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, origin || "*"),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0]
    if (!token) return next(new Error('Unauthorized'))
    const decoded = jwt.verify(token, 'NPMNODEV')
    socket.userId = decoded._id
    return next()
  } catch (err) {
    return next(new Error('Unauthorized'))
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId
  if (userId) {
    socket.join(String(userId))
  }

  socket.on('message:send', async (payload, callback) => {
    try {
      const { to, text, attachments } = payload || {}
      if (!to || (!text && !(attachments && attachments.length))) {
        if (callback) callback({ ok: false, error: 'Invalid payload' })
        return
      }
      const message = await Message.create({ sender: userId, receiver: to, text, attachments })
      const messageDto = {
        _id: message._id,
        sender: String(userId),
        receiver: String(to),
        text: message.text,
        attachments: message.attachments || [],
        isRead: message.isRead,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      }
      io.to(String(to)).emit('message:received', messageDto)
      io.to(String(userId)).emit('message:sent', messageDto)
      if (callback) callback({ ok: true, data: messageDto })
    } catch (err) {
      if (callback) callback({ ok: false, error: err.message })
    }
  })

  socket.on('message:read', async ({ from }, callback) => {
    try {
      if (!from) {
        if (callback) callback({ ok: false, error: 'Invalid payload' })
        return
      }
      await Message.updateMany({ sender: from, receiver: userId, isRead: false }, { $set: { isRead: true } })
      io.to(String(from)).emit('message:read:ack', { by: String(userId) })
      if (callback) callback({ ok: true })
    } catch (err) {
      if (callback) callback({ ok: false, error: err.message })
    }
  })

  socket.on('disconnect', () => {})
});

connectDb()
  .then(() => {
    console.log('MongoDB Connected...😍');
    server.listen(3000, () => {
      console.log('Listening on 3000')
    })
  })
  .catch(() => {
    console.log('DB Not Connected...🍌')
  })


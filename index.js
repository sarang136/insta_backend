
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const { connectDb } = require('./src/configs/database');    // <-- This line will import the function of database connectivity
const cookieParser = require('cookie-parser')
const authRouter = require('./src/routes/auth');
const requestRouter = require('./src/routes/requests');
const profileRouter = require('./src/routes/profile');
const userRouter = require('./src/routes/user');
const cors = require('cors');

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


connectDb()   // Call the function to connect to the database, Created a function to connect to a database
    .then(() => {
        console.log('MongoDB Connected...😍');
        app.listen(3000, () => {
            console.log("Listening on 3000");
        })
    })
    .catch(() => {
        console.log("DB Not Connected...🍌")
    })


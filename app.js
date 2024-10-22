import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import session from 'express-session'
import './googleStrategy.js'
const app = express()

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(cors())
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())


import userRouter from './routes/user.routes.js'
import authRouter from './routes/oauth.routes.js'
app.use('/api/users',userRouter)
app.use('/api/auth',authRouter)

export {app}
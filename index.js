import dotenv from 'dotenv'
dotenv.config({path: './.env'})
import connectDB from './db.js'
import { app } from './app.js'

connectDB()
.then(() =>{
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running at port ${process.env.PORT}`)
    })
    app.get('/',(req,res)=>{
        res.send("hello")
    })
})
.catch((err) => {
    console.log("MongoDB Connection Failed !!!",err)
})
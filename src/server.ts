import express from "express"
import mongoose from "mongoose"
import http from "http"
import dotenv from "dotenv"
dotenv.config()
import userData from "./router/user/userData"

const app = express()
const server = http.createServer(app)


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(express.json())

mongoose.connect("mongodb+srv://fumi:jhPmwWf0skf8lhWb@regic-database-1.0dj9jrk.mongodb.net/?retryWrites=true&w=majority&appName=regic-database-1").then((res)=>{
    console.log("connection db!")
}).catch((error)=>{
    console.log(error)
    console.log("connection error")
})

export const client_id = process.env.GOOGLE_CLIENT_ID
export const client_secret = process.env.GOOGLE_CLIENT_SECRET
export const auth_URL = process.env.AUTH_URL

app.use("/user",userData)

server.listen(5000,()=>{
    console.log("server run!")
})
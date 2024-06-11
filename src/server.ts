import express from "express"
import mongoose from "mongoose"
import http from "http"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
dotenv.config()
import userData from "./router/user/userData"
import machineData from "./router/remoteMachine/remoteMachineData"
import cmdLog from "./router/cmdLog/cmdLogData"
import { authFunction } from "./functions/authFunctions"

const app = express()
const server = http.createServer(app)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

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
app.use("/remotemachine",machineData)
app.use("/cmdlog",cmdLog)

server.listen(5000,async()=>{
    // console.log(await authFunction("ya29.a0AXooCgtvHIF9paclAL8h6VDQAy1shsyJIFmUBgo7aJOiivRX3JG-RDhIVq0rPWOiy4PVsfUHyg71v06vsJr1VIQb2koP_I8W8LZ_tLlHNEdoVLlb5azM03o3cb6VWrIL5dpweiZpfFLBx4E1Sljwse-v05sn5ZvMyaLNaCgYKAeMSARASFQHGX2MikwlJ-doDpi0k6dEHntEDzA0171","1%2F%2F0e1vV-m3Tq2lACgYIARAAGA4SNwF-L9Ir7FiaA1NSnrTE74makkuDLZKRaCdUasdWt4osa10G_CGuIkd0IxtknXX7OZLq9i9G-aI","43a9b42b-c7f8-4780-a27a-eef44646c6e0"))
    console.log("server run!")
})
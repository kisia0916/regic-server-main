import express, { Request, Response, NextFunction } from 'express';
import mongoose from "mongoose"
import http from "http"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
dotenv.config()
import userData from "./router/user/userData"
import machineData from "./router/remoteMachine/remoteMachineData"
import cmdLog from "./router/cmdLog/cmdLogData"
import bodyParser from "body-parser"
import jwt from "jsonwebtoken"
import { error_format } from './router/errorFormat';
import {Server} from "socket.io"
import { socketFunctions } from './webSocket/socketFunctions';
import cors from "cors"
import User from './models/User';
import { ignorePathList } from './ignorePath';

const app = express()
const server = http.createServer(app)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

export const client_id = process.env.GOOGLE_CLIENT_ID
export const client_secret = process.env.GOOGLE_CLIENT_SECRET
export const auth_URL = process.env.AUTH_URL
export const jwt_secret_key = process.env.JWT_SECRET_KEY

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(cors({
    origin: ["https://regic-instans-private.onrender.com","https://regic-instans-2.onrender.com","https://regic-instans-1.onrender.com","http://localhost:3000","http://localhost:1212"], // ReactアプリケーションのURL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 許可するHTTPメソッド
    allowedHeaders: ['Content-Type', 'Authorization'], // 許可するヘッダー
    credentials:true
}));
//すべてのcorsを許可
app.use(express.json())
app.use(bodyParser.json());
app.use((err: SyntaxError, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      console.error('Bad JSON:', err.message);
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    next();
  });

mongoose.connect("mongodb+srv://fumi:jhPmwWf0skf8lhWb@regic-database-1.0dj9jrk.mongodb.net/?retryWrites=true&w=majority&appName=regic-database-1").then((res)=>{
    console.log("connection db!")
}).catch((error)=>{
    console.log(error)
    console.log("connection error")
})


//websocket
export const io = new Server(server,{
    cors:{
        origin:["https://regic-instans-private.onrender.com","https://regic-instans-2.onrender.com","https://regic-instans-1.onrender.com","http://localhost:1212","http://localhost:3000"],
        allowedHeaders: ["my-custom-header",'Content-Type', 'Authorization'],
        methods:['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
})
io.on("connection",(socket)=>{
    console.log("user con")
    socketFunctions(socket)
})

app.use("/user",userData)

//authミドルウェア
app.use((req:any,res,next)=>{
    try{
        if (ignorePathList.findIndex((i)=>i === req.path) !== -1){
            next()
        }else{
            const jwtToken = req.body.jwt_token
            if (jwtToken){
                return new Promise((resolve,reject)=>{
                    jwt.verify(jwtToken,jwt_secret_key as string,async(error:any,decode:any)=>{
                        if (error){
                            return res.status(401).json(error_format("auth_error","status 481"))
                        }
                        const regicUser = await User.findOne({userId:decode.userId})
                        if (regicUser){
                            const date = Math.floor(Date.now()/1000)
                            const exp = decode.exp
                            if (date>exp){
                                resolve(res.status(400).json(error_format("token_time_out","status 400")))
                            }else{
                                req.auth_result = {decode:decode}
                                next()
                            }
                        }else{
                            resolve(res.status(404).json(error_format("user_not_found","status 404")))
                        }
                    })
                }).then(()=>{}).catch((error)=>{
                    return res.status(500).json(error_format("server_error","status 500"))
                })
            }else{  
                return res.status(400).json(error_format("bad_request5","status 400"))
            }
        }
    }catch{
        return res.status(500).json(error_format("server_error","status 500"))
    }
})
app.use("/remotemachine",machineData)
app.use("/cmdlog",cmdLog)

server.listen(5000,async()=>{
    console.log("server run!")
})

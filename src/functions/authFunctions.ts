import axios from "axios"
import User from "../models/User"
import { client_id, client_secret } from "../server";
import { authResultInterface, jwt_format } from "../Interfaces/authReturnInterface";
import jwt from "jsonwebtoken"

export interface auth_status_type {
    status:"success"|"error"|"time_out",
    decode:jwt_format|undefined
}

export const authFunction = (jwtToken:string,secretToken:string):auth_status_type=>{
    if (jwtToken){
        let status:"success"|"error"|"time_out" = "error";
        let decodeResult:jwt_format|undefined = undefined
        jwt.verify(jwtToken,secretToken,(error:any,decode:any)=>{
            const date = Math.floor(Date.now()/1000)
            const exp = decode.exp
            if (error){
               status = "error"
            }else if (date>exp){
                status = "time_out"
            }else{
                status = "success"
            }
            decodeResult = decode
        })
        return {status:status,decode:decodeResult}
    }else{  
        return {status:"error",decode:undefined}
    }
}
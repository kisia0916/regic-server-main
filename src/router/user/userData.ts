import express from "express"
import {uuid} from "uuidv4"
import User, { UserInterface, UserInterfaceMain } from "../../models/User"
import axios from "axios"
import jwt from "jsonwebtoken"

import { error_format } from "../errorFormat"
import { auth_URL, client_id, client_secret, jwt_secret_key } from "../../server"
import { checkBodyContents } from "../../functions/checkBodyContents"

const router = express.Router()

interface authReturnDataInterface {
    picture:string,
    name:string,
    userId:string,
}
interface authReturnJwtTokens {
    status:"success"|"error"
    token:string,
}

const generate_jwt_token = (data:authReturnDataInterface):string=>{
    const option = {
        expiresIn: '3d'
    }
    return jwt.sign(data,jwt_secret_key as string,option)
}

router.post("/auth",async(req,res)=>{
    try{
        const authCode = req.body.authCode
        const jwt_token = req.body.jwtToken
        if (authCode){
            try{
                let returnData:authReturnDataInterface;
                const userTokens = await axios.post("https://oauth2.googleapis.com/token",{
                    code:authCode,
                    client_id:client_id,
                    client_secret:client_secret,
                    redirect_uri:auth_URL,
                    grant_type:"authorization_code"
                })
                let accessToken:string = userTokens.data.access_token
                let refreshToken:string = userTokens.data.refresh_token
                const googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
                    headers:{
                        Authorization:`Bearer ${accessToken}`
                    }
                })
                const regicUserInfo:UserInterfaceMain|null = await User.findOne({mail:googleUserInfo.data.email}) 
                if (regicUserInfo){
                    returnData = {
                        picture:googleUserInfo.data.picture,
                        name:googleUserInfo.data.name,
                        userId:regicUserInfo.userId,
                    }
                }else{
                    //新しいユーザーを作成
                    const newUser = await new User({
                        userId:uuid(),
                        userName:googleUserInfo.data.name,
                        mail:googleUserInfo.data.email
                    })
                    newUser.save()
                    returnData = {
                        picture:googleUserInfo.data.picture,
                        name:googleUserInfo.data.name,
                        userId:newUser.userId,
                    }
                }
                //generate secret key 
                const returnToken:authReturnJwtTokens = {status:"success",token:generate_jwt_token(returnData)}
                return res.status(200).json(returnToken)
            }catch(error){
                return res.status(401).json(error_format("auth_error","status 401"))
            }
        }else if (jwt_token){
            let userDecodeData:authReturnJwtTokens|undefined;
            let jwtAuthCode:boolean = true
            jwt.verify(jwt_token, jwt_secret_key as string, (error:any,decode:any)=>{
                if (error){
                    jwtAuthCode = false
                }else{
                    userDecodeData = decode
                }
            })
            if (!jwtAuthCode){
                return res.status(401).json(error_format("auth_error","status 401"))
            }
            const returnToken:authReturnJwtTokens = {status:"success",token:jwt_token}
            return res.status(200).json(returnToken)
        }else{
            return res.status(400).json(error_format("bad request","status 400"))
        }
    }catch(error){
        console.log(error)
        return res.status(500).json(error_format("server error","status 500"))
    }
})

router.post("/auth-desktop",async(req,res)=>{
    /*
        このAPIはデスクトップクライアントの認証用です
        emailとリフレッシュトークンで取得したgoogleアカウントのemailと取得比較して適合すればOK
     */
    try{
        const email = req.body.email
        const refreshToken = req.body.refreshToken
        const bodyCheck = checkBodyContents([email,refreshToken])
        
    }catch{

    }
})

export default router
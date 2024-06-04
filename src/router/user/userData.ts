import express from "express"
import {uuid} from "uuidv4"
import User, { UserInterface, UserInterfaceMain } from "../../models/User"
import axios from "axios"

import { error_format } from "../errorFormat"
import { auth_URL, client_id, client_secret } from "../../server"

const router = express.Router()

interface authReturnDataInterface {
    accessToken:string,
    refreshToken:string,
    email:string,
    picture:string,
    userId:string,
}
router.post("/auth",async(req,res)=>{
    try{
        console.log(process.env.GOOGLE_CLIENT_ID)
        console.log(client_secret)
        const authCode = req.body.authCode
        let accessToken:string = req.body.accessToken
        let refreshToken:string = req.body.refreshToken

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
                accessToken = userTokens.data.access_token
                refreshToken = userTokens.data.refresh_token
                const googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
                    headers:{
                        Authorization:`Bearer ${accessToken}`
                    }
                })
                const regicUserInfo:UserInterfaceMain|null = await User.findOne({mail:googleUserInfo.data.email}) 
                if (regicUserInfo){
                    returnData = {
                        accessToken:accessToken,
                        refreshToken:refreshToken,
                        email:googleUserInfo.data.email,
                        picture:googleUserInfo.data.picture,
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
                        accessToken:accessToken,
                        refreshToken:refreshToken,
                        email:googleUserInfo.data.email,
                        picture:googleUserInfo.data.picture,
                        userId:newUser.userId,
                    }
                }
                return res.status(200).json(returnData)
            }catch(error){
                return res.status(401).json(error_format("auth_error","status 401"))
            }
        }else if (accessToken && refreshToken){
            //login
            const getRegicUserInfo = async(googleUserInfo:any):Promise<boolean | authReturnDataInterface>=>{

                const regicUserInfo:UserInterfaceMain|null = await User.findOne({mail:googleUserInfo.data.email})
                if (regicUserInfo){
                    const returnData:authReturnDataInterface = {
                        accessToken:accessToken,
                        refreshToken:refreshToken,
                        email:googleUserInfo.data.email,
                        picture:googleUserInfo.data.picture,
                        userId:regicUserInfo.userId,
                    }
                    return returnData
                }else{
                    return false
                }
            }
            try{
                const googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
                    headers:{
                        Authorization:`Bearer ${accessToken}`
                    }
                })
                const regicUserInfo:authReturnDataInterface|boolean = await getRegicUserInfo(googleUserInfo)
                if (regicUserInfo){
                    res.status(200).json(regicUserInfo)
                }else{
                    return res.status(404).json(error_format("user_not_found","status 404"))
                }
            }catch(error:any){
                //token refresh
                try{
                    const googleNewTokens:any = await axios.post("https://oauth2.googleapis.com/token",{
                        client_id:client_id,
                        client_secret:client_secret,
                        refresh_token:refreshToken,
                        grant_type:"refresh_token"
                    })
                    console.log(googleNewTokens.access_token)
                    const googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
                        headers:{
                            Authorization:`Bearer ${googleNewTokens.access_token}`
                        }
                    })
                    const regicUserInfo:authReturnDataInterface|boolean = await  getRegicUserInfo(googleUserInfo)
                    if (regicUserInfo){
                        res.status(200).json(regicUserInfo)
                    }else{
                        return res.status(404).json(error_format("user_not_found","status 404"))
                    }
                }catch(error){
                    return res.status(401).json(error_format("auth_error","status 400"))
                }
            }
        }else{
            return res.status(400).json(error_format("bad_request","status 400"))
        }
    }catch(error){
        console.log(error)
        return res.status(500).json(error_format("server error","status 500"))
    }
})

export default router
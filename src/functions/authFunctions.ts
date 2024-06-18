import axios from "axios"
import User from "../models/User"
import { client_id, client_secret } from "../server";
import { authResultInterface } from "../Interfaces/authReturnInterface";

interface newTokenInterface{
    access_token:string,
    expires_in:number,
    scope:string,
    token_type:string,
    id_token:string
}

export const authFunction = async(accessToken:string,refreshToken:string,userId:string):Promise<authResultInterface>=>{
    let googleUserInfo:any;
    try{
        refreshToken = decodeURIComponent(refreshToken)
        googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
            headers:{
                Authorization:`Bearer ${accessToken}`
            }
        })
        const regicUserinfo = await User.findOne({mail:googleUserInfo.data.email})
        if (regicUserinfo){
            return {state:regicUserinfo.userId===userId?true:false,newToken:""}
        }else{
            return {state:false,newToken:""}
        }
    }catch(error){
        try{
            const newTokens = await axios.post("https://oauth2.googleapis.com/token",{
                client_id:client_id,
                client_secret:client_secret,
                refresh_token:refreshToken,
                grant_type:"refresh_token"
            })
            googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
                headers:{
                    Authorization:`Bearer ${newTokens.data.access_token}`
                }
            })
            const regicUserinfo = await User.findOne({mail:googleUserInfo.data.email})
            if (regicUserinfo){
                return {state:regicUserinfo.userId===userId?true:false,newToken:newTokens.data.access_token}
            }else{
                return {state:false,newToken:""}
            }
        }catch(error){
            return {state:false,newToken:""}
        }
    }
}

export const authFunctionRefreshOnly = async(refreshToken:string,email:string)=>{
    try{
        let googleUserInfo:any
        const newTokens = await axios.post("https://oauth2.googleapis.com/token",{
            client_id:client_id,
            client_secret:client_secret,
            refresh_token:refreshToken,
            grant_type:"refresh_token"
        })
        googleUserInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo",{
            headers:{
                Authorization:`Bearer ${newTokens.data.access_token}`
            }
        })
        const regicUser = await User.findOne({mail:email})
        if (regicUser){
        }else{
            return {state:false,newToken:""}
        }
    }catch(error){
        return {state:false,newToken:""}
    }
}
import express from "express"
import RemoteMachine, { RemoteMachineInterfaceMain } from "../../models/RemoteMachine"
import User from "../../models/User"
import { authFunction } from "../../functions/authFunctions"
import { authResultInterface } from "../../Interfaces/authReturnInterface"
import { error_format } from "../errorFormat"
import { uuid } from "uuidv4"
import CmdLogs, { CmdLogInterfaceMain } from "../../models/CmdLogs"
import { checkBodyContents } from "../../functions/checkBodyContents"

const router = express.Router()

router.post("/newlog",async(req,res)=>{
    try{
        const access_token = req.body.access_token
        const refresh_token = req.body.refresh_token
        const userId = req.body.userId
        const machineId = req.body.machineId
        const content = req.body.content
        const response = req.body.response
        const bodyCheck = checkBodyContents([access_token,refresh_token,userId,machineId,content,response])
        console.log(bodyCheck)
        const authResult:authResultInterface = await authFunction(access_token,refresh_token,userId)
        if (authResult.state){
            if (bodyCheck){
                const newLog = new CmdLogs({
                    logId:uuid(),
                    machineId:machineId,
                    userId:userId,
                    content:content,
                    response:response
                })
                newLog.save()
                return res.status(200).json(newLog)
            }else{
                return res.status(400).json(error_format("bad_request","status 400"))
            }
        }else{
            return res.status(401).json(error_format("auth_error","status 401"))
        }
    }catch(error){
        return res.status(500).json("error")
    }
})

router.get("/getlogs",async(req,res)=>{
    const getNum = 50
    try{
        const access_token = req.body.access_token
        const refresh_token = req.body.refresh_token
        const userId = req.body.userId
        const page = Number(req.body.page)
        const bodyCheck = checkBodyContents([access_token,refresh_token,userId,page])
        const authResult:authResultInterface = await authFunction(access_token,refresh_token,userId)
        if (authResult.state){
            if (bodyCheck){
                const getData:CmdLogInterfaceMain[]|null = await CmdLogs.find({userId:userId}).skip(page*getNum).limit(getNum).sort({$natural:-1}) as CmdLogInterfaceMain[]|null
                return res.status(200).json({data:getData,token:authResult.newToken})
            }else{
                return res.status(400).json(error_format("bad_request","status 400"))
            }
        }else{
            return res.status(401).json(error_format("auth_error","status 401"))
        }
    }catch(error){
        return res.status(500).json(error_format("server error","status 500"))
    }
})

export default router
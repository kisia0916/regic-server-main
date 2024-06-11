import express from "express"
import RemoteMachine, { RemoteMachineInterfaceMain } from "../../models/RemoteMachine"
import User from "../../models/User"
import { authFunction } from "../../functions/authFunctions"
import { authResultInterface } from "../../Interfaces/authReturnInterface"
import { error_format } from "../errorFormat"
import { uuid } from "uuidv4"
import { checkBodyContents } from "../../functions/checkBodyContents"

const router = express.Router()

router.post("/newmachine",async(req,res)=>{
    try{
        const access_token = req.body.access_token
        const refresh_token = req.body.refresh_token
        const userId = req.body.userId
        const bodyCheck = checkBodyContents([access_token,refresh_token,userId])
        const authResult:authResultInterface = await authFunction(access_token,refresh_token,userId)
        if (authResult.state){
            if (bodyCheck){
                const newMachine = new RemoteMachine({
                    machineId:uuid(),
                    machineName:"new machine",
                    userId:userId,
                    pubKey:"",
                    privateKey:""
                })
                newMachine.save()
                return res.status(200).json(newMachine)
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

router.get("/getmachine",async(req,res)=>{
    try{
        const access_token = req.body.access_token
        const refresh_token = req.body.refresh_token
        const userId = req.body.userId
        const bodyCheck = checkBodyContents([access_token,refresh_token,userId])
        const authResult:authResultInterface = await authFunction(access_token,refresh_token,userId)
        if (authResult.state){
            if (bodyCheck){
                const getData:RemoteMachineInterfaceMain[]|null = await RemoteMachine.find({userId:userId})
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
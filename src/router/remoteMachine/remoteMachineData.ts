import express from "express"
import RemoteMachine, { RemoteMachineInterfaceMain } from "../../models/RemoteMachine"
import User from "../../models/User"
import { auth_status_type, authFunction } from "../../functions/authFunctions"
import { authResultInterface, custom_request } from "../../Interfaces/authReturnInterface"
import { error_format } from "../errorFormat"
import { uuid } from "uuidv4"
import { checkBodyContents } from "../../functions/checkBodyContents"
import { jwt_secret_key } from "../../server"
import bcrypt from "bcrypt"

const router = express.Router()

router.post("/newmachine",async(req:any,res)=>{
    try{
        const machineName = req.body.machine_name
        const bodyCheck = checkBodyContents([machineName])
        if (bodyCheck){
            const authResult:auth_status_type = req.auth_result
            const regicUser = await User.findOne({userId:authResult.decode?.userId})
            if (regicUser){
                const machineToken = uuid()
                const hashToken = await bcrypt.hash(machineToken,10)
                const newMachine = new RemoteMachine({
                    machineId:uuid(),
                    machineName:machineName,
                    userId:regicUser.userId,
                    machineToken:hashToken
                })
                await newMachine.save()
                return res.status(200).json({machineToken:machineToken})
            }else{
                return res.status(404).json(error_format("user_not_found","status 404"))
            }
        }else{
            return res.status(400).json(error_format("bad_request","status 400"))
        }
    }catch{
        return res.status(500).json(error_format("server error","status 500"))
    }
})

router.get("/getmachine",async(req:custom_request,res)=>{
    try{
        const userId = req.auth_result?.decode.userId
        const machineList:RemoteMachineInterfaceMain[] = await RemoteMachine.find({userId:userId})
        return res.status(200).json(machineList)
    }catch(error){
        console.log(error)
        return res.status(500).json(error_format("server error","status 500"))
    }
})

export default router
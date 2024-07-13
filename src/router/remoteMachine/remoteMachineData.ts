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
import { onlineHostList } from "../../webSocket/socketFunctions"
import jwt from "jsonwebtoken"

const router = express.Router()

router.post("/newmachine",async(req:any,res)=>{
    try{
        const machineName = req.body.machine_name
        const machine_jwt_token = req.body.machine_jwt_token
        const bodyCheck = checkBodyContents([machineName,machine_jwt_token])
        console.log(machineName)
        console.log(machine_jwt_token)
        if (bodyCheck){
            return new Promise((resolve,reject)=>{
                jwt.verify(machine_jwt_token,jwt_secret_key as string,async(error:any,decode:any)=>{
                    if (error){
                        return res.status(401).json(error_format("auth_error","status 401"))
                    }else{
                        const userId = atob(decode.userId as string)
                        const regicUser = await User.findOne({userId:userId})
                        const isCreated = await RemoteMachine.findOne({machineName:machineName})
                        if (regicUser && !isCreated){
                            const machineToken = uuid()
                            const hashToken = await bcrypt.hash(machineToken,10)
                            const newMachine = new RemoteMachine({
                                machineId:uuid(),
                                machineName:machineName,
                                userId:regicUser.userId,
                                machineToken:hashToken
                            })
                            await newMachine.save()
                            resolve(res.status(200).json({machineToken:machineToken}))
                        }else{
                            resolve(res.status(404).json(error_format("user_not_found","status 404")))
                        }
                    }
                })
            }).then(()=>{}).catch((error)=>{
                return res.status(500).json(error_format("server_error","status 500"))
            })
        }else{
            return res.status(400).json(error_format("bad_request3","status 400"))
        }
    }catch{
        return res.status(500).json(error_format("server error","status 500"))
    }
})

router.post("/generatemjwt",async(req:custom_request,res)=>{
    try{
        if (req.auth_result?.decode){
            const  encodedUserId:string = btoa(req.auth_result.decode.userId as string)
            const jwtData = {
                userId:encodedUserId
            }
            const mjwtToken = jwt.sign(jwtData,jwt_secret_key as string,{
                expiresIn:'1h'
            })
            return res.status(200).json({token:mjwtToken})
        }
    }catch(error){
        // console.log(error)
        return res.status(500).json(error_format("server error","status 500"))
    }
})

router.post("/getmachine",async(req:custom_request,res)=>{
    try{
        const userId = req.auth_result?.decode.userId
        const machineList:RemoteMachineInterfaceMain[] = await RemoteMachine.find({userId:userId})
        return res.status(200).json({allRemoteMachine:machineList,onlineRemoteMachine:onlineHostList})
    }catch(error){
        console.log(error)
        return res.status(500).json(error_format("server error","status 500"))
    }
})

export default router
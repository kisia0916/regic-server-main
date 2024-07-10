import { authFunction } from "../functions/authFunctions"
import { connectionRequestInterface, first_handshake_interface, onlineHostListInterface, onlineUserListInterface } from "../Interfaces/socketInterface"
import RemoteMachine from "../models/RemoteMachine"
import { io, jwt_secret_key } from "../server"
import bcrypt from "bcrypt"


export const onlineUserList:onlineUserListInterface[] = []
export const onlineHostList:onlineHostListInterface[] = []

export const socketFunctions = (socket:any)=>{
    socket.on("first_handshake",async(data:first_handshake_interface)=>{
        if (data.userType === "client"){
            //auth  
            const authResult = authFunction(data.token,jwt_secret_key as string)
            if (authResult.status === "success"){
                const onlineUser = onlineUserList.findIndex((i)=>i.userId === authResult.decode?.userId)
                if (onlineUser === -1){
                    onlineUserList.push({
                        userId:authResult.decode?.userId as string,
                        socketId:socket.id    
                    })
                }
                console.log(onlineUserList)
            }else{

            }
        }else if (data.userType === "remoteMachine"){
            //auth
            const hashPass = await bcrypt.hash(data.token,10)
            const regicRemoteMachine = await RemoteMachine.findOne({machineToken:hashPass})
            if (regicRemoteMachine){
                const remoteMachine = onlineHostList.findIndex((i)=>i.machineId === regicRemoteMachine.machineId)
                if (remoteMachine === -1){
                    onlineHostList.push({
                        machineId:regicRemoteMachine.machineId,
                        machineName:regicRemoteMachine.machineName,
                        socketId:socket.id
                    })
                }
                console.log(onlineHostList)
            }else{

            }
        }
    })

    socket.on("connection_request",async(data:connectionRequestInterface)=>{
        const jwtAuthResult = authFunction(data.jwtToken,jwt_secret_key as string)
        if (jwtAuthResult.status === "success"){
            //isOnline
            const onlineHostInfo = onlineHostList.find((i)=>i.machineId === data.machineId)
            if (onlineHostInfo){
                const regicMachineData = await RemoteMachine.findOne({machineId:data.machineId})
                if (regicMachineData){
                    if (regicMachineData.userId === jwtAuthResult.decode?.userId){
                        io.to(onlineHostInfo.socketId).emit("")
                    }else{

                    }
                }else{
                    //404
                }
            }else{
                //offline
            }

        }else{

        }
    })
}
import { authFunction } from "../functions/authFunctions"
import { connectionRequestInterface, first_handshake_interface, onlineHostListInterface, onlineUserListInterface } from "../Interfaces/socketInterface"
import RemoteMachine from "../models/RemoteMachine"
import { io, jwt_secret_key } from "../server"
import bcrypt, { hash } from "bcrypt"


export const onlineUserList:onlineUserListInterface[] = []
export const onlineHostList:onlineHostListInterface[] = []

export const socketFunctions = (socket:any,mco:number)=>{
    socket.on("first_handshake",async(data:first_handshake_interface)=>{
        try{
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
                    }else{
                        onlineUserList.splice(onlineUser,1)
                        onlineUserList.push({
                            userId:authResult.decode?.userId as string,
                            socketId:socket.id    
                        })
                    }
                    console.log(onlineUserList)
                    io.to(socket.id).emit("first_handshake_done","")
                }else{
                    io.to(socket.id).emit("socket-error","auth_error")
                }
            }else if (data.userType === "remoteMachine"){
                //auth
                const token = atob(data.token)
                const machineId = token.split(":").length == 2?token.split(":")[1]:undefined
                if (machineId ){
                    const regicRemoteMachine = await RemoteMachine.findOne({machineId:machineId})
                    if (regicRemoteMachine){
                        if (await bcrypt.compareSync(atob(data.token),regicRemoteMachine.machineToken)){
                            const remoteMachine = onlineHostList.findIndex((i)=>i.machineId === regicRemoteMachine.machineId)
                            if (remoteMachine === -1){
                                onlineHostList.push({
                                    machineId:regicRemoteMachine.machineId,
                                    machineName:regicRemoteMachine.machineName,
                                    socketId:socket.id,
                                    machineToken:data.token as string,
                                    userId:regicRemoteMachine.userId
                                })
                            }else{
                                onlineHostList.splice(remoteMachine,1)
                                onlineHostList.push({
                                    machineId:regicRemoteMachine.machineId,
                                    machineName:regicRemoteMachine.machineName,
                                    socketId:socket.id,
                                    machineToken:data.token as string,
                                    userId:regicRemoteMachine.userId
                                })
                            }
                            console.log(onlineHostList)
                            io.to(socket.id).emit("first_handshake_done","")
                        }else{
                            io.to(socket.id).emit("socket-error","auth_error")
                        }
                    }else{
                        io.to(socket.id).emit("socket-error","auth_error")
                    }
                }
            }
        }catch{
            io.to(socket.id).emit("socket-error","server_error1")
        }
    })

    socket.on("connection_request",async(data:connectionRequestInterface)=>{
        try{
            const jwtAuthResult = authFunction(data.jwtToken,jwt_secret_key as string)
            console.log(jwtAuthResult)
            if (jwtAuthResult.status === "success"){
                //isOnline
                const onlineHostInfo = onlineHostList.find((i)=>i.machineId === data.machineId)
                if (onlineHostInfo){
                    const regicMachineData = await RemoteMachine.findOne({machineId:data.machineId})
                    if (regicMachineData){
                        if (regicMachineData.userId === jwtAuthResult.decode?.userId){
                            io.to(onlineHostInfo.socketId).emit("connection_request",{userId:regicMachineData.userId})
                        }else{
                            io.to(socket.id).emit("socket-error","server_error3")
                        }
                    }else{
                        //404
                        io.to(socket.id).emit("socket-error","machine_not_found")
                    }
                }else{
                    //offline
                    io.to(socket.id).emit("socket-error","remote_machine_offline")
                }
            }else{
                io.to(socket.id).emit("socket-error","server_error4")
            }
        }catch{
            io.to(socket.id).emit("socket-error","server_error5")
        }
    })
    socket.on("new_process_created",(data:{userId:string,data:any,machineToken:string})=>{
        try{
            const user = onlineUserList.find((i)=>i.userId === data.userId)
            const host = onlineHostList.find((i)=>i.machineToken === data.machineToken)
            if (user && host){
                if (user.userId === host.userId){
                    console.log("done")
                    // io.to(socket.id).emit("run_command",{command:"dir",userId:user.userId})
                    io.to(user.socketId).emit("new_process_created",{data:data.data,machineId:host.machineId})
                }else{
                    console.log("done2")
                    io.to(user.socketId).emit("socket-error","auth_error")
                }
            }else{
                io.to(socket.id).emit("socket-error","server_error6")
            }
        }catch{
            io.to(socket.id).emit("socket-error","server_error7")
        }
    })
    socket.on("process_result",(data:{userId:string,data:any,machineToken:string})=>{
        try{
            const user = onlineUserList.find((i)=>i.userId === data.userId)
            const host = onlineHostList.find((i)=>i.machineToken === data.machineToken)
            if (user && host){
                if (user.userId === host.userId){
                    io.to(user.socketId).emit("process_result",{data:data})
                }else{
                    io.to(user.socketId).emit("socket-error","auth_error")
                }
            }else{
                io.to(socket.id).emit("socket-error","server_error6")
            }
        }catch{
            io.to(socket.id).emit("socket-error","server_error7")
        }
    })
    socket.on("run_command",(data:{token:string,command:string,machineId:string})=>{
        try{
            console.log(data)
            const authResult:any = authFunction(data.token,jwt_secret_key as string)
            if (authResult.status === "success"){
                const targetHost = onlineHostList.find((i)=>i.machineId === data.machineId)
                if (targetHost){
                    console.log(targetHost)
                    console.log(authResult)
                    if (targetHost.userId === authResult.decode.userId){
                        console.log("send")
                        io.to(targetHost.socketId).emit("run_command",{command:data.command,userId:authResult.decode.userId})
                    }else{
                        io.to(socket.id).emit("socket-error","server_error")
                    }
                }else{
                    io.to(socket.id).emit("socket-error","server_error")
                }
            }else{
                io.to(socket.id).emit("socket-error","server_error")
            }
        }catch{
            io.to(socket.id).emit("socket-error","server_error0")
        }
    })
}
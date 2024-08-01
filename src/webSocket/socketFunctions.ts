import { authFunction } from "../functions/authFunctions"
import { connectionListInterface, connectionRequestInterface, first_handshake_interface, onlineHostListInterface, onlineUserListInterface } from "../Interfaces/socketInterface"
import RemoteMachine from "../models/RemoteMachine"
import { io, jwt_secret_key } from "../server"
import bcrypt, { hash } from "bcrypt"


export const onlineUserList:onlineUserListInterface[] = []
export const onlineHostList:onlineHostListInterface[] = []
export const connectionList:connectionListInterface[] = []

export const socketFunctions = (socket:any)=>{
    let clientInfo:{type:"client"|"remoteMachine"|"",token:string,id:string} = {type:"",token:"",id:""}
    console.log("kokokokokoko")
    console.log(clientInfo)
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
                    clientInfo = {type:"client",token:data.token,id:authResult.decode?.userId as string}
                    const targetUserIndex = connectionList.findIndex((i:any)=>i.id === authResult.decode?.userId)
                    if (targetUserIndex  === -1){
                         connectionList.push({id:authResult.decode?.userId as string,targets:[]})
                    }else{
                        connectionList.splice(targetUserIndex,1)
                        connectionList.push({id:authResult.decode?.userId as string,targets:[]})
                    }
                    console.log(connectionList)
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
                            clientInfo = {type:"remoteMachine",token:data.token,id:regicRemoteMachine.machineId}
                            const targetHostIndex = connectionList.findIndex((i:any)=>i.id === regicRemoteMachine.machineId)
                            if (targetHostIndex  === -1){
                               connectionList.push({id:regicRemoteMachine.machineId as string,targets:[]})
                            }else{
                               connectionList.splice(targetHostIndex,1)
                               connectionList.push({id:regicRemoteMachine.machineId as string,targets:[]})
                            }
                            console.log(connectionList)
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
                    const userConnectionListIndex = connectionList.findIndex((i)=>i.id === user.userId)
                    const hostConnectionListIndex = connectionList.findIndex((i)=>i.id === host.machineId)
                    if (userConnectionListIndex !== -1){
                        connectionList[userConnectionListIndex].targets.push(host.machineId)
                    }
                    if (hostConnectionListIndex !== -1){
                        connectionList[hostConnectionListIndex].targets.push(user.userId)
                    }
                    console.log(connectionList)
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
    socket.on("run_command",(data:{userId:string,command:string,machineId:string})=>{
        try{
            // const authResult:any = authFunction(data.token,jwt_secret_key as string)
            // if (authResult.status === "success"){
            if (data.userId === clientInfo.id){
                const targetHost = onlineHostList.find((i)=>i.machineId === data.machineId)
                if (targetHost){
                    console.log(targetHost)
                    if (targetHost.userId === data.userId){
                        console.log("send")
                        io.to(targetHost.socketId).emit("get_input",{command:data.command,userId:data.userId})
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
    socket.on("resize_term",(data:{token:string,size:number[],machineId:string})=>{
        try{
            const authResult:any = authFunction(data.token,jwt_secret_key as string)
            if (authResult.status === "success"){
                const targetHost = onlineHostList.find((i)=>i.machineId === data.machineId)
                if (targetHost){
                    if (targetHost.userId === authResult.decode.userId){
                        io.to(targetHost.socketId).emit("resize_term",{userId:authResult.decode.userId,size:data.size})
                    }else{
                        io.to(socket.id).emit("socket-error","server_error0")
                    }
                }else{
                    io.to(socket.id).emit("socket-error","server_error0")
                }
            }else{
                io.to(socket.id).emit("socket-error","server_error0")
            }
        }catch{
            io.to(socket.id).emit("socket-error","server_error0")
        }
    })  
    socket.on("restart_host",(data:{token:string,machineId:string})=>{
        try{
            const authResult = authFunction(data.token,jwt_secret_key as string)
            if (authResult.status === "success"){
                const targetHost = onlineHostList.find((i)=>i.machineId === data.machineId)
                if (targetHost){
                    if (authResult.decode?.userId === targetHost.userId){
                        io.to(targetHost.socketId).emit("restart_host","")
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
            io.to(socket.id).emit("socket-error","server_error")
        }
    })

    socket.on("interval-ping",(data:any)=>{
        io.to(socket.id).emit("interval-pong",clientInfo)
    })

    socket.on("disconnect",()=>{
        if (onlineUserList.find((i:any)=>i.socketId === socket.id)){
            console.log("(-⊙ω⊙-)ゞ")
            //send client signal to host
            const connectionListIndex = connectionList.findIndex((i)=>i.id === clientInfo.id)
            if (connectionListIndex !== -1){
                connectionList[connectionListIndex].targets.forEach((i)=>{
                    const targetHost = onlineHostList.find((k)=>k.machineId === i)
                    const hostConnectionIndex = connectionList.findIndex((f)=>f.id === i)
                    if (hostConnectionIndex !== -1){
                        const disconUserIndex = connectionList[hostConnectionIndex].targets.findIndex((j)=>j === clientInfo.id)
                        if (disconUserIndex !== -1){
                            connectionList[hostConnectionIndex].targets.splice(disconUserIndex,1)
                        }
                    }
                    if (targetHost){
                        io.to(targetHost.socketId).emit("disconnect_client",{userId:clientInfo.id})
                    }
                })
                connectionList.splice(connectionListIndex,1)
            }
            const targetUserIndex = onlineUserList.findIndex((i)=>i.userId === clientInfo.id)
            if (targetUserIndex !== -1){
                onlineUserList.splice(targetUserIndex,1)
            }
        }else if (onlineHostList.find((i:any)=>i.socketId === socket.id)){
            console.log("host disconnected")
            const connectionListIndex = connectionList.findIndex((i)=>i.id === clientInfo.id)
            if (connectionListIndex !== -1){
                connectionList[connectionListIndex].targets.forEach((i)=>{
                    const targetUser = onlineUserList.find((k)=>k.userId === i)
                    const userConnectionIndex = connectionList.findIndex((f)=>f.id === i)
                    if (userConnectionIndex !== -1){
                        const disconHostIndex = connectionList[userConnectionIndex].targets.findIndex((j)=>j === clientInfo.id)
                        if (disconHostIndex !==-1){
                            connectionList[userConnectionIndex].targets.splice(disconHostIndex,1)
                        }
                    }
                    if (targetUser){
                        io.to(targetUser.socketId).emit("disconnect_remote_machine",{machineId:clientInfo.id})
                    }
                })
                connectionList.splice(connectionListIndex,1)
            }
            const targetHostIndex = onlineHostList.findIndex((i)=>i.machineId === clientInfo.id)
            if (targetHostIndex !== -1){
                onlineHostList.splice(targetHostIndex,1)
            }
        }
        console.log(onlineHostList)
        console.log(onlineUserList)
        console.log(connectionList)
    })
}

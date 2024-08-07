
export interface first_handshake_interface {
    userType:"remoteMachine"|"client",
    token:string
}

export interface onlineUserListInterface{
    userId:string,
    socketId:string
}

export interface onlineHostListInterface {
    machineId:string,
    machineName:string,
    socketId:string,
    machineToken:string,
    userId:string
}

export interface connectionRequestInterface {
    machineId:string,
    jwtToken:string
}

export interface connectionListInterface {
    id:string,
    targets:string[]
}
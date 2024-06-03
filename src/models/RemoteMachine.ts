import mongoose, { Schema }  from "mongoose";

export interface RemoteMachineInterface {
    machineId:string,
    machineName:string,
    userId:string,
    pubKey:string,
    privateKey:string,
}
export interface RemoteMachineInterfaceMain extends RemoteMachineInterface{
    createdAt:string,
    updateAt:string,
    __v:number,
    _id:any
}

const dbSchema:Schema = new Schema({
    machineId:{
        type:String,
        required:true
    },
    machineName:{
        type:String,
        required:true,
    },
    userId:{
        type:String,
        required:true
    },
    pubKey:{
        type:String,
        required:true
    },
    privateKey:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

export default mongoose.model<RemoteMachineInterface>("RemoteMachine",dbSchema)
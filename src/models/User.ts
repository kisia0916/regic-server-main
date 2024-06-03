import mongoose, { Schema } from "mongoose";

export interface UserInterface {
    userId:string,
    userName:string,
    mail:string
}
export interface UserInterfaceMain extends UserInterface{
    createdAt:string,
    updateAt:string,
    __v:number,
    _id:any
}

const dbSchema:Schema = new Schema({
    userId:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    mail:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

export default mongoose.model<UserInterface>("User",dbSchema)
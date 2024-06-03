import mongoose, { Document, Schema } from "mongoose";

export interface CmdLogInterface extends Document {
    logId:string,
    userId:string,
    content:string,
    response:string
}
export interface CmdLogInterfaceMain extends CmdLogInterface{
    createdAt:string,
    updateAt:string,
    __v:number,
    _id:any
}

const dbSchema:Schema = new Schema({
    logId:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    response:{
        type:String,
        default:""
    }
},{
    timestamps:true
})

export default mongoose.model<CmdLogInterface>("CmdLog",dbSchema)
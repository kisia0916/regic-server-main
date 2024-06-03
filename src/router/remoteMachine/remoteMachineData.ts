import express from "express"
import RemoteMachine from "../../models/RemoteMachine"
import User from "../../models/User"

const router = express.Router()

router.post("/getmachineinfo",async(req,res)=>{
    try{
        const userId:string = req.body.userId
        const pass:string = req.body.pass
        const userData = await User.findOne({userId:userId})
        if (userData){

        }else{
            return res.status(500).json("error")
        }
    }catch(error){
        
    }
})

export default router
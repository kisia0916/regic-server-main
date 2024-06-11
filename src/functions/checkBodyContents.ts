
export const checkBodyContents = (contents:any[]) =>{
    let state:boolean = true
    contents.forEach((i)=>{
        if (i === undefined) state = false
    })
    return state
}
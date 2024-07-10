import express, { Request, Response, NextFunction } from 'express';

export interface authResultInterface{
    state:boolean,
    newToken:string
}
export interface jwt_format {
    picture:string,
    name: string,
    userId: string,
    iat: number,
    exp: number
}

export interface custom_request extends Request{
    auth_result?:{
        decode:jwt_format
    }
}
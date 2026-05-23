import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";



const createUser = async ( req: Request,res: Response) => {
  try {
    const result =await authService.createUserIntoDB(req.body);
     sendResponse(res,{
    statusCode:201,
      success:true,
      message:"User registered successfully",
      data:result.rows[0]
    });
  } catch (err: any) {
   sendResponse(res,{
    statusCode:500,
      success:false,
      message:err.message,
       error:err
    });
  }
};



const loginUser = async ( req: Request,res: Response) => {
  try {
    const result =await authService.loginUserIntoDB (req.body);
    sendResponse(res,{
    statusCode:201,
      success:true,
      message:"Login successfully!",
      data:result,
    });
  } catch (err: any) {
     sendResponse(res,{
    statusCode:500,
      success:false,
      message:err.message,
       error:err
    });
  }
};


export const authController = {
  createUser,
  loginUser,
};
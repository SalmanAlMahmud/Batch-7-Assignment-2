import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Role } from "../types";
import sendResponse from "../utility/sendResponse";
import config from "../config";
import { pool } from "../db";


const auth = (...roles : Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
       sendResponse(res,{
    statusCode:401,
      success:false,
      message:"Unauthorize access!!",
      
    });
    }

    const payload = jwt.verify(
      token as string,
      config.jwt_secret as string,
    ) as JwtPayload;

    const userInfo = await pool.query(
      `
            SELECT * FROM users WHERE email = $1    
        `,
      [payload.email],
    );

    const user = userInfo.rows[0];
    if (userInfo.rows.length === 0) {
         sendResponse(res,{
    statusCode:404,
      success:false,
      message:"User not found!!",
      
    });
    }

    if (roles.length && !roles.includes(user.role)) {
         sendResponse(res,{
    statusCode:403,
      success:false,
      message:"Forbidden Access!!!",
    });
    }
    req.user = payload
    next();
  };
};

export default auth;
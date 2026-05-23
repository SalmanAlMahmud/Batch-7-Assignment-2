import type { NextFunction, Request, Response } from "express";
import type { IUserObject } from "./issue.interface";

import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendResponse";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUserObject;
  try {
    const result = await issueService.createIssueInDB(req.body, user);
        sendResponse(res,{
    statusCode:201,
      success:true,
      message:"Issue created successfully!",
      data:result.rows[0],
    });
   
  } catch (error: any) {
    next(error);
  }
};
export const issueController = {
  createIssue,

};
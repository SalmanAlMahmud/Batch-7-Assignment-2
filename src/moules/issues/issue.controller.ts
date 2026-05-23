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
const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { sort, type, status } = req.query;
  try {
    const result = await issueService.getAllIssuesFromDB(
      sort as string,
      type as string,
      status as string,
    );
     sendResponse(res,{
    statusCode:200,
      success:true,
      message:"Issues retrived successfully",
      data:result,});
  } catch (error: any) {
    next(error);
  }
};
const getASingleissue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id;
  try {
    const result = await issueService.getASingleIssueFromDB(id as string);
   sendResponse(res,{
    statusCode:200,
      success:true,
      message:"Issues retrived successfully",
      data:result,});
  } catch (error: any) {
    next(error);
  }
};
const updateAIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role, id: userId } = req.user as IUserObject;
  const id = req.params.id;
  try {
    const result = await issueService.updateIssueIntoDB(
      id as string,
      userId as number,
      role as string,
      req.body,
    );
   sendResponse(res,{
    statusCode:200,
      success:true,
      message:"Issue updated successfully",
      data:result?.rows[0],});
  } catch (error: any) {
    next(error);
  }
};
const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  try {
    const result = await issueService.deleteIssueFromDB(id as string);
    if (result.rowCount === 0) {
     sendResponse(res,{
    statusCode:404,
      success:false,
      message:"Issue Not Found",
    });
    }
   sendResponse(res,{
    statusCode:200,
      success:true,
      message:"Issue deleted successfully",
});
  } catch (error: any) {
    next(error);
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getASingleissue,
  updateAIssue,
  deleteIssue

};

import { pool } from "../../db";
import type { IIssue, IUserObject } from "./issue.interface";

const createIssueInDB = async (payload: IIssue,user: IUserObject,) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *     
    `,
    [title, description, type, user.id],
  );

  if (result.rows.length === 0) {
    throw new Error("Issue cannot be created");
  }

  return result;
};
export const issueService = {
  createIssueInDB,
};
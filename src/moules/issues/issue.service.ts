
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
const getAllIssuesFromDB = async (
  sort: string | undefined,
  type: string | undefined,
  status: string | undefined,
) => {
  const order = sort === "oldest" ? "ASC" : "DESC";
  let issuesLength;

  if (type && status) {
    issuesLength = await pool.query(
      `SELECT * FROM issues WHERE type = $1 AND status = $2 ORDER BY created_at ${order}`,
      [type, status],
    );
  } else if (type) {
    issuesLength = await pool.query(
      `SELECT * FROM issues WHERE type = $1 ORDER BY created_at ${order}`,
      [type],
    );
  } else if (status) {
    issuesLength = await pool.query(
      `SELECT * FROM issues WHERE status = $1 ORDER BY created_at ${order}`,
      [status],
    );
  } else {
    issuesLength = await pool.query(
      `SELECT * FROM issues ORDER BY created_at ${order}`,
    );
  }
  const issues = issuesLength.rows;

  if (issues.length === 0) {
    throw new Error("No issues found");
  }

  const allRepoterId = issues.map((issue) => issue.reporter_id);

  const getUsers = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id = ANY($1)
    `,
    [allRepoterId],
  );

  const reporterMap = new Map(getUsers.rows.map((user) => [user.id, user]));

  const result = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap.get(issue.reporter_id),
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return result;
};
const getASingleIssueFromDB = async (id: string) => {
  const issue = await pool.query(
    `
        SELECT * FROM issues where id = $1
    `,
    [id],
  );

  if (issue.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const reporterId = issue.rows[0].reporter_id;

  const reporterInfo = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id = $1
    `,
    [reporterId],
  );

  if (reporterInfo.rows.length === 0) {
    throw new Error("Reporter not found");
  }

  const user = reporterInfo.rows[0];

  const result = {
    id: issue.rows[0].id,
    title: issue.rows[0].title,
    description: issue.rows[0].description,
    type: issue.rows[0].type,
    status: issue.rows[0].status,
    reporter: user,
    created_at: issue.rows[0].created_at,
    updated_at: issue.rows[0].updated_at,
  };
  return result;
};

export const issueService = {
  createIssueInDB,
  getAllIssuesFromDB,
  getASingleIssueFromDB
};
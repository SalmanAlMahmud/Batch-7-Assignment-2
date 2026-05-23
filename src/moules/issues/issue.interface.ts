import type { JwtPayload } from "jsonwebtoken";

export interface IIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

export interface IUserObject extends JwtPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface IssueQueryParams {
  sort?: string;
  type?: string;
  status?: string;
}
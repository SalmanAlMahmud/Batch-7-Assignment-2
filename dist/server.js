

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/moules/auth/auth.route.ts
import { Router } from "express";

// src/moules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connectionString: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'contributor',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  reporter_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`);
    console.log("Table created successfully");
  } catch (err) {
    console.error("Error creating table:", err);
  }
};

// src/moules/auth/auth.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("User already exists!");
  }
  const result = await pool.query(
    `
  INSERT INTO users
  (
    name,
    email,
    password,
    role
  )

  VALUES
  (
    $1,
    $2,
    $3,
    COALESCE($4,'contributor')
  )

  RETURNING
    id,
    name,
    email,
    role,
    created_at,
    updated_at
  `,
    [
      name,
      email,
      hashedPassword,
      role
    ]
  );
  delete result.rows[0].passward;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(
    password,
    user.password
  );
  if (!matchPassword) {
    throw new Error("Invalid credentials!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_secret, { expiresIn: "7d" });
  delete user.password;
  return { token, user };
};
var authService = {
  createUserIntoDB,
  loginUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/moules/auth/auth.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: err.message,
      error: err
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Login successfully!",
      data: result
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: err.message,
      error: err
    });
  }
};
var authController = {
  createUser,
  loginUser
};

// src/moules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.createUser);
router.post("/login", authController.loginUser);
var authRouter = router;

// src/moules/issues/issue.route.ts
import { Router as Router2 } from "express";

// src/moules/issues/issue.service.ts
var createIssueInDB = async (payload, user) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *     
    `,
    [title, description, type, user.id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue cannot be created");
  }
  return result;
};
var getAllIssuesFromDB = async (sort, type, status) => {
  const order = sort === "oldest" ? "ASC" : "DESC";
  let issuesLength;
  if (type && status) {
    issuesLength = await pool.query(
      `SELECT * FROM issues WHERE type = $1 AND status = $2 ORDER BY created_at ${order}`,
      [type, status]
    );
  } else if (type) {
    issuesLength = await pool.query(
      `SELECT * FROM issues WHERE type = $1 ORDER BY created_at ${order}`,
      [type]
    );
  } else if (status) {
    issuesLength = await pool.query(
      `SELECT * FROM issues WHERE status = $1 ORDER BY created_at ${order}`,
      [status]
    );
  } else {
    issuesLength = await pool.query(
      `SELECT * FROM issues ORDER BY created_at ${order}`
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
    [allRepoterId]
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
    updated_at: issue.updated_at
  }));
  return result;
};
var getASingleIssueFromDB = async (id) => {
  const issue = await pool.query(
    `
        SELECT * FROM issues where id = $1
    `,
    [id]
  );
  if (issue.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const reporterId = issue.rows[0].reporter_id;
  const reporterInfo = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id = $1
    `,
    [reporterId]
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
    updated_at: issue.rows[0].updated_at
  };
  return result;
};
var updateIssueIntoDB = async (id, userId, role, payload) => {
  const { title, description, type } = payload;
  const issueInfo = await pool.query(
    `
        SELECT * FROM issues WHERE id = $1    
    `,
    [id]
  );
  const issue = issueInfo.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (role === "contributor" && userId !== issue.reporter_id) {
    throw new Error("Unauthorized Access!");
  }
  if (role === "contributor" && issue.status !== "open") {
    throw new Error("Issue is already in progress");
  }
  if (role === "contributor" && issue.status === "open" && userId === issue.reporter_id) {
    const result = await pool.query(
      `
        UPDATE issues
        SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           type = COALESCE($3, type),
           status = 'in_progress',
           updated_at = NOW()
       WHERE id = $4
       RETURNING *
    `,
      [title, description, type, id]
    );
    return result;
  } else if (role === "maintainer") {
    const result = await pool.query(
      `
        UPDATE issues
        SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           type = COALESCE($3, type),
           status = 'in_progress',
           updated_at = NOW()
       WHERE id = $4
       RETURNING *
    `,
      [title, description, type, id]
    );
    return result;
  }
  throw new Error("You are not authorized to update this issue");
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM issues WHERE id = $1
  `,
    [id]
  );
  return result;
};
var issueService = {
  createIssueInDB,
  getAllIssuesFromDB,
  getASingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/moules/issues/issue.controller.ts
var createIssue = async (req, res, next) => {
  const user = req.user;
  try {
    const result = await issueService.createIssueInDB(req.body, user);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  const { sort, type, status } = req.query;
  try {
    const result = await issueService.getAllIssuesFromDB(
      sort,
      type,
      status
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getASingleissue = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await issueService.getASingleIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateAIssue = async (req, res, next) => {
  const { role, id: userId } = req.user;
  const id = req.params.id;
  try {
    const result = await issueService.updateIssueIntoDB(
      id,
      userId,
      role,
      req.body
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result?.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await issueService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue Not Found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getASingleissue,
  updateAIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorize access!!"
      });
    }
    const payload = jwt2.verify(
      token,
      config_default.jwt_secret
    );
    const userInfo = await pool.query(
      `
            SELECT * FROM users WHERE email = $1    
        `,
      [payload.email]
    );
    const user = userInfo.rows[0];
    if (userInfo.rows.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "User not found!!"
      });
    }
    if (roles.length && !roles.includes(user.role)) {
      sendResponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Forbidden Access!!!"
      });
    }
    req.user = payload;
    next();
  };
};
var auth_default = auth;

// src/types/index.ts
var user_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/moules/issues/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default(user_ROLE.contributor, user_ROLE.maintainer), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getASingleissue);
router2.patch("/:id", auth_default(user_ROLE.contributor, user_ROLE.maintainer), issueController.updateAIssue);
router2.delete("/:id", auth_default(user_ROLE.maintainer), issueController.deleteIssue);
var IssueRouter = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is Running"
    });
  }
);
app.use("/api/auth", authRouter);
app.use("/api/issues", IssueRouter);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map
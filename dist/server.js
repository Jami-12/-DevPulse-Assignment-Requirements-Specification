

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express3 from "express";

// src/modules/auth/auth.route.ts
import express from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/db/db.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/db.ts
var pool = new Pool({
  connectionString: config_default.database_url
});
var initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'contributor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(30) NOT NULL,
      status VARCHAR(30) DEFAULT 'open',
      reporter_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Database connected successfully");
};

// src/modules/auth/auth.service.ts
var createUser = async (payload) => {
  const hashed = await bcrypt.hash(payload.password, 10);
  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [payload.name, payload.email, hashed, payload.role || "contributor"]
  );
  return result.rows[0];
};
var loginUser = async (email, password) => {
  const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email
  ]);
  const user = userResult.rows[0];
  if (!user) throw new Error("User not found");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid password");
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role
    },
    config_default.jwt_secret,
    { expiresIn: "1d" }
  );
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  createUser,
  loginUser
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  const user = await authService.createUser(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user
  });
};
var loginUser2 = async (req, res) => {
  try {
    const result = await authService.loginUser(
      req.body.email,
      req.body.password
    );
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message
    });
  }
};
var authController = {
  signupUser,
  loginUser: loginUser2
};

// src/modules/auth/auth.route.ts
var router = express.Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRouter = router;

// src/modules/issues/issue.route.ts
import express2 from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
  try {
    const decoded = jwt2.verify(token, config_default.jwt_secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};
var roleCheck = (...roles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }
    next();
  };
};

// src/modules/issues/issue.service.ts
var createIssueIntoDB = async (data) => {
  const { title, description, type, status, reporter_id } = data;
  if (!data.type) {
    throw new Error("Type must be provide");
  }
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [title, description, type, status || "open", reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
  let i = 1;
  if (type) {
    conditions.push(`type = $${i++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status = $${i++}`);
    values.push(status);
  }
  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }
  sql += sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
  const issuesRes = await pool.query(sql, values);
  const issues = issuesRes.rows;
  if (!issues.length) {
    return [];
  }
  const ids = [...new Set(issues.map((i2) => i2.reporter_id))];
  const usersRes = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [ids]
  );
  return issues.map((issue) => {
    const reporterObj = usersRes.rows.find((u) => u.id === issue.reporter_id) || null;
    const { id, title, description, type: type2, status: status2, created_at, updated_at } = issue;
    const createTime = created_at instanceof Date ? created_at.toISOString() : created_at;
    const updateTime = updated_at instanceof Date ? updated_at.toISOString() : updated_at;
    return {
      id,
      title,
      description,
      type: type2,
      status: status2,
      reporter: reporterObj,
      created_at: createTime,
      updated_at: updateTime
    };
  });
};
var getSingleIssueFromDB = async (id) => {
  const issueRes = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  const issue = issueRes.rows[0];
  if (!issue) return null;
  const userRes = await pool.query(
    `SELECT id,name,role FROM users WHERE id=$1`,
    [issue.reporter_id]
  );
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: {
      id: userRes.rows[0].id,
      name: userRes.rows[0].name,
      role: userRes.rows[0].role
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (id, payload) => {
  const old = await getSingleIssueFromDB(id);
  const result = await pool.query(
    `
    UPDATE issues
    SET title=$1,
        description=$2,
        type=$3,
        status=$4,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=$5
    RETURNING *
    `,
    [payload.title, payload.description, payload.type, payload.status, id]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);
  return true;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issue.controller.ts
var createIssue = async (req, res) => {
  const user = req.user;
  const issue = await issueService.createIssueIntoDB({
    ...req.body,
    reporter_id: user.id
  });
  res.status(201).json({
    success: true,
    message: "Issue created successfully",
    data: issue
  });
};
var getAllIssues = async (req, res) => {
  const data = await issueService.getAllIssuesFromDB(req.query);
  res.json({
    success: true,
    data
  });
};
var getSingleIssue = async (req, res) => {
  const data = await issueService.getSingleIssueFromDB(req.params.id);
  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Issue not found"
    });
  }
  res.json({
    success: true,
    data
  });
};
var updateIssue = async (req, res) => {
  const user = req.user;
  const issue = await issueService.getSingleIssueFromDB(
    req.params.id
  );
  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found"
    });
  }
  if (user.role === "contributor" && (issue.reporter.id !== user.id || issue.status !== "open")) {
    return res.status(403).json({
      success: false,
      message: "You can only update your own open issues"
    });
  }
  const updated = await issueService.updateIssueIntoDB(
    req.params.id,
    req.body
  );
  res.json({
    success: true,
    message: "Issue updated successfully",
    data: updated
  });
};
var deleteIssue = async (req, res) => {
  await issueService.deleteIssueFromDB(req.params.id);
  res.json({
    success: true,
    message: "Issue deleted successfully"
  });
};
var userController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issue.route.ts
var router2 = express2.Router();
router2.post("/", auth, userController.createIssue);
router2.get("/", userController.getAllIssues);
router2.get("/:id", userController.getSingleIssue);
router2.patch("/:id", auth, userController.updateIssue);
router2.delete(
  "/:id",
  auth,
  roleCheck("maintainer"),
  userController.deleteIssue
);
var issueRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = async (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express3();
app.use(express3.json());
app.get("/", (req, res) => {
  res.send("DevPulse Server Running");
});
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var start = async () => {
  await initDB();
  app_default.listen(config_default.port || 5e3, () => {
    console.log(`Server running on ${config_default.port}`);
  });
};
start();
//# sourceMappingURL=server.js.map
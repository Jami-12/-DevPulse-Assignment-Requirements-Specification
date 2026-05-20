import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { pool } from "./db/db";
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issues/issue.route";

const app: Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("DevPulse Server Running");
});

app.get("/db-test", async (req: Request, res: Response) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);

export default app;

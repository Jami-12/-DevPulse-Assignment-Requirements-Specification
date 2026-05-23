import express from "express";
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issues/issue.route";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("DevPulse Server Running");
});

app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.use(globalErrorHandler);

export default app;

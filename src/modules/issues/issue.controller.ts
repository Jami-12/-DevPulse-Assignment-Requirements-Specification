import type { Request, Response } from "express";
import { issueService } from "./issue.service";


const createIssue = async (req: Request, res: Response) => {
  const user = (req as any).user;

  const issue = await issueService.createIssueIntoDB({
    ...req.body,
    reporter_id: user.id,
  });

  res.json({
    success: true,
    message: "Issue created successfully",
    data: issue,
  });
};

const getAllIssues = async (req: Request, res: Response) => {
  const issues = await issueService.getAllIssuesFromDB(req.query);

  res.json({
    success: true,
    message: "All issues fetched successfully",
    data: issues,
  });
};

const getSingleIssue = async (req: Request, res: Response) => {
  const id = req.params.id;

  const issue = await issueService.getSingleIssueFromDB(id as string);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found",
    });
  }

  res.json({
    success: true,
    message: "Single issue fetched successfully",
    data: issue,
  });
};

const updateIssue = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = req.params.id;

  const issue = await issueService.getSingleIssueFromDB(id as string);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found",
    });
  }

  if (user.role === "contributor" && issue.reporter_id !== user.id) {
    return res.status(403).json({
      success: false,
      message: "You can only update your own issue",
    });
  }

  console.log(req.body);

  const updated = await issueService.updateIssueIntoDB(
    id as string,
    req.body
  );

  res.json({
    success: true,
    message: "Issue updated successfully",
    data: updated,
  });
};
const deleteIssue = async (req: Request, res: Response) => {
  const id = req.params.id;

  await issueService.deleteIssueFromDB(id as string);

  res.json({
    success: true,
    message: "Issue deleted successfully",
  });
};

export const userController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};

import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { user_ROLE } from "../../types";





const router = Router();

router.post('/', auth(user_ROLE.contributor, user_ROLE.maintainer), issueController.createIssue)
router.get('/', issueController.getAllIssues);
router.get("/:id", issueController.getASingleissue);



export const IssueRouter = router
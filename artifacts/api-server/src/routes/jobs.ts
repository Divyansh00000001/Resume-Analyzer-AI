import { Router, type IRouter } from "express";
import { JOB_ROLES } from "../lib/jobRoles";

const router: IRouter = Router();

router.get("/roles", (_req, res) => {
  res.json(JOB_ROLES);
});

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import superadminRouter from "./superadmin.js";
import schoolRouter from "./school.js";
import publicRouter from "./public.js";
import studentRouter from "./student.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/superadmin", superadminRouter);
router.use("/school", schoolRouter);
router.use("/public", publicRouter);
router.use("/student", studentRouter);

export default router;

import { Router } from "express";

import authRouter from "@/routes/auth.routes";
import categoryRouter from "@/routes/category.routes";
import jobRouter from "@/routes/job.routes";
import profileRouter from "@/routes/profile.routes";
import uploadRouter from "@/routes/upload.routes";
import workerRouter from "@/routes/worker.routes";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/profiles", profileRouter);
router.use("/upload", uploadRouter);
router.use("/categories", categoryRouter);
router.use("/workers", workerRouter);
router.use("/jobs", jobRouter);

export default router;

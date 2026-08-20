import { Router } from "express";
import authRouter from "@/routes/auth.routes";
import categoryRouter from "@/routes/category.routes";
import profileRouter from "@/routes/profile.routes";
import workerRouter from "@/routes/worker.routes";
import searchRouter from "@/routes/search.routes";
import jobRouter from "@/routes/job.routes";
import applicationRouter from "@/routes/application.routes";
import reviewRouter from "@/routes/review.routes";
import customerRouter from "@/routes/customer.routes";

const router: Router = Router();

// Endpoint grouping for API v1
router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/profiles", profileRouter);
router.use("/workers", workerRouter);
router.use("/customers", customerRouter);
router.use("/search", searchRouter);
router.use("/jobs", jobRouter);
router.use("/applications", applicationRouter);
router.use("/reviews", reviewRouter);

export default router;

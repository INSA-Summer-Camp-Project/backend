import { Router } from "express";

import adminRouter from "@/routes/admin.routes";
import applicationRouter from "@/routes/application.routes";
import authRouter from "@/routes/auth.routes";
import categoryRouter from "@/routes/category.routes";
import jobRouter from "@/routes/job.routes";
import notificationRouter from "@/routes/notification.routes";
import paymentRouter from "@/routes/payment.routes";
import profileRouter from "@/routes/profile.routes";
import reviewRouter from "@/routes/review.routes";
import uploadRouter from "@/routes/upload.routes";
import workerRouter from "@/routes/worker.routes";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/profiles", profileRouter);
router.use("/upload", uploadRouter);
router.use("/categories", categoryRouter);
router.use("/workers", workerRouter);
router.use("/applications", applicationRouter);
router.use("/jobs", jobRouter);
router.use("/payments", paymentRouter);
router.use("/reviews", reviewRouter);
router.use("/notifications", notificationRouter);
router.use("/admin", adminRouter);

export default router;

import { Router } from "express";
import authRouter from "@/routes/auth.routes";
import categoryRouter from "@/routes/category.routes";
import workerRouter from "@/routes/worker.routes";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/workers", workerRouter);

export default router;

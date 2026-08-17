import { Router } from "express";

import * as workerController from "@/controllers/worker.controller";

const router: Router = Router();

router.get("/", workerController.getWorkers);
router.get("/:id", workerController.getWorkerById);

export default router;

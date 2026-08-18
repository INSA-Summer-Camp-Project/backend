import { Router } from "express";
import * as workerController from "@/controllers/worker.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { WorkerQueryDtoSchema } from "@/dtos/worker.dto";

const router: Router = Router();

router.get(
  "/",
  authenticate,
  validate(WorkerQueryDtoSchema, "query"),
  workerController.getWorkers,
);

router.get("/:id", authenticate, workerController.getWorkerById);

export default router;

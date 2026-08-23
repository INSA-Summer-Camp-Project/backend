import { Router } from "express";
import * as workerController from "@/controllers/worker.controller";
import { authenticate, requireActiveRole } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { CreatePortfolioSchema } from "@/dtos/worker.dto";

const router: Router = Router();
const workerOnly = [authenticate, requireActiveRole("WORKER")];

// POST /api/v1/portfolios - Create a portfolio item for authenticated worker
router.post(
  "/",
  ...workerOnly,
  validate(CreatePortfolioSchema),
  workerController.createPortfolio,
);

// DELETE /api/v1/portfolios/:portfolioId - Delete a portfolio item
router.delete("/:portfolioId", ...workerOnly, workerController.deletePortfolio);

export default router;

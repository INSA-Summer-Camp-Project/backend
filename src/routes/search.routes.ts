import { Router } from "express";
import * as searchController from "@/controllers/search.controller";
import { validate } from "@/middlewares/validate.middleware";
import { WorkerQueryDtoSchema } from "@/dtos/worker.dto";

const router: Router = Router();

/**
 * @route   GET /api/v1/search/providers
 * @desc    Search and filter workers (public discovery)
 * @access  Public
 */
router.get(
  "/providers",
  validate(WorkerQueryDtoSchema, "query"),
  searchController.searchProviders,
);

export default router;

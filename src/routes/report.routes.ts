import { Router } from "express";
import * as reportController from "@/controllers/report.controller";
import { CreateReportDtoSchema } from "@/dtos/report.dto";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

router.use(authenticate);

// Submit a new report
router.post(
  "/",
  validate(CreateReportDtoSchema),
  reportController.submitReport,
);

// Get my reports
router.get("/my-reports", reportController.getMyReports);

export default router;

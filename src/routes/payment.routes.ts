import { Router } from "express";

import * as paymentController from "@/controllers/payment.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.post("/checkout", authenticate, paymentController.createCheckout);
router.post("/webhook", paymentController.handleWebhook);
router.get("/verify/:txRef", authenticate, paymentController.verifyPayment);

export default router;

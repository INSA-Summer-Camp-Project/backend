import { Router } from "express";

import * as categoryController from "@/controllers/category.controller";

const router: Router = Router();

// Categories are public
router.get("/", categoryController.getAllCategories);

export default router;

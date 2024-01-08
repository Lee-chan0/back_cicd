import express from "express";
import { FeedsController } from '../controllers/feeds.controller.js'
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

const feedsController = new FeedsController();

router.get("/feeds", feedsController.getFeeds)
router.get("/feeds/mydiaries", authMiddleware, feedsController.getMyFeeds)
router.post("/feeds/:diaryId/like", authMiddleware, feedsController.like)

export default router;
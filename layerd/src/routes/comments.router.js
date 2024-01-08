import express from "express";
import { CommentsController } from '../controllers/comments.controller.js'
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

const commentsController = new CommentsController();

router.post("/diary/detail/comment/:diaryId", authMiddleware, commentsController.createComments)
router.get("/diary/detail/comment/:diaryId", authMiddleware, commentsController.getComments)
router.patch("/diary/detail/comment/:commentId", authMiddleware, commentsController.updateComments)
router.delete("/diary/detail/comment/:commentId", authMiddleware, commentsController.deleteComment)

export default router;
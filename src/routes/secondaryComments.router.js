import express from "express"
import { SecondaryCommentController } from '../controllers/secondaryComments.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = express.Router();

const secondaryCommentController = new SecondaryCommentController()

router.post('/diary/detail/secondaryComment/:diaryId/:commentId', authMiddleware, secondaryCommentController.createSecondaryComment)
router.get('/diary/detail/secondaryComment/:diaryId', authMiddleware, secondaryCommentController.getSecondComments)
router.patch('/diary/detail/secondaryComment/:diaryId/:commentId', authMiddleware, secondaryCommentController.updateSecondaryComment)
router.delete('/diary/detail/comment/:secondaryCommentId', authMiddleware, secondaryCommentController.deleteSecondaryComment)

export default router;
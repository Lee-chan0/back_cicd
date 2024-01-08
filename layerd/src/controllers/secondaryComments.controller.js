import { SecondaryCommentsService } from '../services/secondaryComments.service.js'
import { CommentSchema } from '../validation/joi.validation.js'


export class SecondaryCommentController {
    secondaryCommentsService = new SecondaryCommentsService()

    
    createSecondaryComment = async (req, res, next) => {
        
        try {
        const { diaryId, commentId } = await CommentSchema.validateAsync(req.params);
        const { content } = await CommentSchema.validateAsync(req.body);
        const { userId } = req.user;

        await this.secondaryCommentsService.createSecondaryComment(
            userId,
            diaryId,
            commentId,
            content,
        )
        return res.status(201).json({ message : "대댓글이 등록되었습니다" })
    } catch (err) {
        next(err)
    }
    }

    getSecondComments = async (req, res, next) => {

        try {
            const { diaryId } = await CommentSchema.validateAsync(req.params);
    
            const comments = await secondaryCommentsService.findSecondaryComments(
            diaryId
            )
            return res.status(200).json({ data: comments })

        } catch (err) {
            next(err)
        }
        
    }

    updateSecondaryComment = async (req, res, next) => {

        try {
            const { secondaryCommentId } = await CommentSchema.validateAsync(req.params);
            const { userId } = req.user;
            const { content } = await CommentSchema.validateAsync(req.body);
    
            const secondaryComment = await this.secondaryCommentsService.findSecondaryComment( secondaryCommentId ) // by commentId
    
            if (!secondaryComment) {
                return res.status(400).json({ message: "존재하지 않는 댓글입니다" });
              }
        
              if (secondaryComment.UserId !== userId) {
                return res.status(401).json({ message: "수정 권한이 없습니다" });
              }
    
            await secondaryCommentsService.updateSecondaryComment(secondaryCommentId, content)
    
            return res.status(201).json({ message : "대댓글 수정 완료"})
        } catch (err) {
            next(err)
        }
    }

    deleteSecondaryComment = async (req, res, next) => {

        const { secondaryCommentId } = CommentSchema.validateAsync(req.params);
        const { userId } = req.user;

        const secondaryComment = await this.secondaryCommentsService.findSecondaryComment( secondaryCommentId )

        if (!secondaryComment) {
            return res.status(401).json({ message : "댓글이 존재하지 않습니다 "})
        }

        if (secondaryComment.userId !== userId) {
            return res.status(401).json({ message : "삭제 권한이 없습니다"})
        }
        await this.secondaryCommentsService.deleteSecondaryComment(
            secondaryCommentId, 
            userId
            )

        return res.status(201).json({ message : "대댓글 삭제 완료"})
    }
}
import { CommentsService } from '../services/comments.service.js'
import { CommentSchema } from '../validation/joi.validation.js'


export class CommentsController {
    commentsService = new CommentsService() 

createComments = async (req, res, next) => {
    try {
    const { diaryId } = await CommentSchema.validateAsync(req.params);
    const { content } = req.body;
    const { userId } = req.user;

    console.log('``````````````````````````')
    console.log(content)

    await this.commentsService.createComment(
        diaryId,
        userId,
        content,
    )
    return res.status(201).json({ message: "댓글이 등록되었습니다" });
} catch (err) {
    next (err)
}
}


getComments = async (req, res, next) => {
    try {
        const { diaryId } = await CommentSchema.validateAsync(req.params);

        const comments = await this.commentsService.findComments(diaryId) // by diaryId

        return res.status(200).json({ data: comments})
    } catch (err) {
        next(err)
    }
}

updateComments = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { commentId } = await CommentSchema.validateAsync(req.params);
        const { content } = await CommentSchema.validateAsync(req.body);

        console.log("------------------------------")
        console.log(userId)
        console.log(content)
        console.log(commentId)

        const comment = await this.commentsService.findComment(
            commentId, 
            userId
            )

            console.log("------------------------------")
            console.log(comment)
            console.log(comment.UserId)
            console.log("------------------------------")

        if (!comment) {
            return res.status(400).json({ message: "존재하지 않는 댓글입니다" });
          }
    
          if (comment.UserId !== userId) {
            return res.status(401).json({ message: "수정 권한이 없습니다" });
          }

          await this.commentsService.updateComment(
            commentId, 
            content
            )

        return res.status(201).json({ meesage : "댓글 수정 완료"})
    } catch(err) {
        next(err)
    }
}

deleteComment = async (req, res, next) => {
    try {
        const { commentId } = await CommentSchema.validateAsync(req.params);
        const { userId } = req.user;

        const comment = await this.commentsService.findComment(commentId, userId) // by commentId

        if (!comment) {
            return res.status(401).json({ message: "댓글이 존재하지 않습니다"})
        }

        if (comment.UserId !== +userId ) {
            return res.status(401).sjon({ message: "삭제 권한이 없습니다"})
        }

        await this.commentsService.deleteComment(commentId, userId)

        return res.status(201).json({ message: "댓글 삭제 완료"})
    } catch (err) {
        next (err)
    }
}
}
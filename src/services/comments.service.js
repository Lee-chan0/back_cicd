import { CommentsRepository } from '../repositories/comments.repository.js'

export class CommentsService {
    commentsRepository = new CommentsRepository();

    createComment = async (diaryId, userId, content) => {

        const comment = await this.commentsRepository.createComment(
            diaryId,
            userId,
            content
        )

        return {
            DiaryId: comment.DiaryId,
            UserId: comment.UserId,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt : comment.updatedAt
        }
    }

    findComments = async (diaryId) => {
        const comments = await this.commentsRepository.findComments(diaryId) // by diaryId

        comments.sort((a,b) => {
            return b.createdAt - a.createdAt
        })

        return comments.map((comment) => {
            return {
                DiaryId : comment.DiaryId,
                UserId : comment.UserId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        })
    }

    findComment = async (commentId, userId) => {
        const comment = await this.commentsRepository.findComment(commentId, userId)

        return comment
    }

    updateComment = async (commentId, content) => {

        const updatedcomment = await this.commentsRepository.updateComment(
            commentId,
            content,
        )

        return {
            DiaryId: updatedcomment.DiaryId,
            UserId: updatedcomment.UserId,
            content: updatedcomment.content,
            createdAt: updatedcomment.createdAt,
            updatedAt : updatedcomment.updatedAt,
            isEdited : updatedcomment.isEdited
        }
    }

    deleteComment = async (commentId, userId) => {
        const comment = await this.commentsRepository.findComment(
            commentId,
            userId
        )
        const deletedComment = await this.commentsRepository.deleteComment(commentId, userId)

        return deletedComment
    }
}
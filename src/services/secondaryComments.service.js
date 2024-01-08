import { SecondaryCommentsRepository } from '../repositories/secondaryComments.repository.js'

export class SecondaryCommentsService {
    secondaryCommentRepository = new SecondaryCommentsRepository();

    findSecondaryComments = async (diaryId) => {
        const secondaryComments = await this.secondaryCommentRepository.findSecondaryComments(
            diaryId
        )
        secondaryComments.sort((a, b) => {
            return b.createdAt - a.createdAt
        })
        return secondaryComments.map((secondaryComment) => {
            return {
                DiaryId: secondaryComment.DiaryId ,
                UserId: secondaryComment.UserId,
                content: secondaryComment.content,
                createdAt: secondaryComment.createdAt,
                updatedAt: secondaryComment.updatedAt
            }
        })
    }

    findSecondaryComment = async (secondaryCommentId) => {
        const secondaryComment = await this.secondaryCommentRepository.findSecondaryComment(
            secondaryCommentId
        )
        return {
            DiaryId: secondaryComment.DiaryId ,
            UserId: secondaryComment.UserId,
            content: secondaryComment.content,
            createdAt: secondaryComment.createdAt,
            updatedAt: secondaryComment.updatedAt
        }
    }

    updateSecondaryComment = async (secondaryCommentId, content) => {
        const updatedSecondaryComment = await this.secondaryCommentRepository.updateSecondaryComment(
            secondaryCommentId,
            content
        )
        return updatedSecondaryComment
    }

    deleteSecondaryComment = async (secondaryCommentId, userId) => {
        const deletedSecondaryComment = await this.secondaryCommentRepository.deleteSecondaryComment(
            secondaryCommentId,
            userId
        )
        return deletedSecondaryComment
    }
}
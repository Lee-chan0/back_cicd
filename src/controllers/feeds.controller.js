import { FeedsService } from '../services/feeds.service.js'
import { DiarySchema } from '../validation/joi.validation.js'
import { startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export class FeedsController {
    feedsService = new FeedsService()

    getFeeds = async (req, res, next) => {
        try{
            const page = parseInt(req.query.page) || 1;
            const pageSize = 10;
            const date = req.query.date
            const thismonth = new Date(date)
        
            const timeZone = "Asia/Seoul";
            const lastCreatedAt = req.query.lastCreatedAt; // 클라이언트에서 전달된 마지막 데이터의 createdAt 값

            if (!date) {

                // 이전 페이지에서 마지막 데이터의 createdAt 값 가져오기 (데이터의 마지막 index값에 해당하는 value의 createdAt 값을 전달받는다)
                
            
                const today = new Date();
                const twoMonthsAgo = utcToZonedTime(
                  startOfDay(subMonths(today, 2)),
                  timeZone
                );
                const todaySeoulTime = utcToZonedTime(endOfDay(today), timeZone);

                const diaryEntries = await this.feedsService.getFeeds(
                    twoMonthsAgo,
                    todaySeoulTime,
                    lastCreatedAt,
                    pageSize,
                    page
                )

                return res.status(200).json({ data : diaryEntries})
            } else {
                const twoMonthsAgo = utcToZonedTime(
                    startOfDay(subMonths(thismonth, 2)),
                    timeZone
                    );
                    const todaySeoulTime = utcToZonedTime(endOfDay(thismonth), timeZone)

                const diaryEntries = await this.feedsService.getFeeds(
                    twoMonthsAgo,
                    todaySeoulTime,
                    lastCreatedAt,
                    pageSize,
                    page
                )

                return res.status(200).json({ data: diaryEntries})
            }
        } catch(err) {
            next(err)
        }
    }

    getMyFeeds = async (req, res, next) => {
        try {
            const { userId } = req.user
            const page = parseInt(req.query.page) || 1;
            const pageSize = 10;
            const date = req.query.date
            const thismonth = new Date(date)
        
            const firstday = startOfMonth(thismonth)
            const lastday = endOfMonth(thismonth)

            const lastCreatedAt = req.query.lastCreatedAt

            if (!date) {
                const today = new Date()
                const diaryEntries = await this.feedsService.getMyFeedsNoDateGiven(
                    userId,
                    today,
                    lastCreatedAt,
                    pageSize,
                    page
                )
                return res.status(200).json({ data: diaryEntries })
            } else {
                const diaryEntries = await this.feedsService.getMyFeeds(
                    userId,
                    firstday,
                    lastday,
                    pageSize,
                    page
                )
                return res.status(200).json({ data: diaryEntries})
            }
        } catch(err) {
            next(err)
        }
    }

    like = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { diaryId } = await DiarySchema.validateAsync(req.params);

            const existsLike = await this.feedsService.existsLike(
                diaryId,
                userId
                )
            
            const existsDiary = await this.feedsService.existsDiary(
                diaryId
            )

            if (!existsDiary) {
                return res.status(400).json({ message: "해당하는 일기가 없습니다"});
            } else {
                if (existsLike) {

                    const diarylikeId = await this.feedsService.existsLikeDiaryLikeId(diaryId, userId)

                    await this.feedsService.deleteLike(
                        diarylikeId,
                        diaryId,
                        userId
                    )

                    const islike = await this.feedsService.decreaseLikeCount(
                        diaryId
                    )
                    return res.status(200).json({message: "좋아요가 취소되었습니다" , data : islike})
                }

                await this.feedsService.newLike(
                    userId,
                    diaryId,
                )

                const likeClick = await this.feedsService.increaseLikeCount(
                    diaryId
                )
                return res.status(201).json({ message : "좋아요가 추가되었습니다", data: likeClick})

            }
        } catch(err) {
            next(err)
        }
    }
}
















export class CommentsController {
    commentsService = new CommentsService()

createComments = async (req, res, next) => {
    try {
    const { diaryId } = await CommentSchema.validateAsync(req.params);
    const { content } = await CommentSchema.validateAsync(req.body);
    const { userId } = req.user;

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

        const comments = await commentsService.findComments(diaryId) // by diaryId

        return res.status(200).json({ data: comments})
    } catch (err) {
        next(err)
    }
}

updateComments = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { commentId } = await CommentSchema.validateAsync(req.body);
        const { content } = await CommentSchema.validateAsync(req.body);

        const comment = await commentsService.findComment() // by commentId

        if (!comment) {
            return res.status(400).json({ message: "존재하지 않는 댓글입니다" });
          }
    
          if (comment.UserId !== userId) {
            return res.status(401).json({ message: "수정 권한이 없습니다" });
          }

          await commentsService.updateComment(commentId, content)

        return res.status(201).json({ meesage : "댓글 수정 완료"})
    } catch {
        next(err)
    }
}

deleteComment = async (req, res, next) => {
    try {
        const { commentId } = await CommentSchema.validateAsync(req.body);
        const { userId } = req.user;

        const comment = await commentsService.findComment() // by commentId

        if (!comment) {
            return res.status(401).json({ message: "댓글이 존재하지 않습니다"})
        }

        if (comment.UserId !== +userId ) {
            return res.status(401).sjon({ message: "삭제 권한이 없습니다"})
        }

        await commentsService.deleteComment( commentId, userId)
        // where: {
        //     commentId: +commentId,
        //     UserId: userId,
        //   }
        
        return res.status(201).json({ message: "댓글 삭제 완료"})
    } catch (err) {
        next (err)
    }
}
}
import { FeedsRepository } from '../repositories/feeds.repository.js'

export class FeedsService {
    feedsRepository = new FeedsRepository();

    getFeeds = async (twoMonthsAgo, todaySeoulTime, lastCreatedAt, pageSize, page) => {

        const feeds = await this.feedsRepository.getFeeds(
            twoMonthsAgo, 
            todaySeoulTime, 
            lastCreatedAt, 
            pageSize, 
            page
        )

        return feeds
    }

    getMyFeedsNoDateGiven = async (userId, today, lastCreatedAt, pageSize, page) => {

        const MyFeedsNoDateGiven = await this.feedsRepository.getMyFeedsNoDateGiven(
            userId, 
            today, 
            lastCreatedAt, 
            pageSize, 
            page
        )

        return MyFeedsNoDateGiven
    }

    getMyFeeds = async (userId, firstday, lastday, pageSize, page) => {

        const MyFeeds = await this.feedsRepository.getMyFeeds(
            userId, 
            firstday, 
            lastday, 
            pageSize, 
            page
        )
        
        return MyFeeds
    }

    existsLike = async (diaryId, userId) => {

        const existsLike = await this.feedsRepository.existsLike(
            diaryId,
            userId
        )

        return existsLike
    }

    existsLikeDiaryLikeId = async (diaryId, userId) => {

        const existsLikeId = await this.feedsRepository.existsLikeDiaryLikeId(
            diaryId,
            userId
        )

        return existsLikeId
    }

    existsDiary = async (diaryId) => {

        const existsDiary = await this.feedsRepository.existsDiary(
            diaryId
        )

        return existsDiary
    }

    deleteLike = async (diarylikeId, diaryId, userId) => {

        await this.feedsRepository.deleteLike(
            diarylikeId, 
            diaryId, 
            userId
        )
    }

    newLike = async (userId, diaryId) => {

        await this.feedsRepository.newLike(
            userId,
            diaryId
        )
    }

    decreaseLikeCount = async (diaryId) => {
        const islike = await this.feedsRepository.decreaseLikeCount(
            diaryId
        )
        return islike
    }

    increaseLikeCount = async (diaryId) => {
        const likeclick = await this.feedsRepository.increaseLikeCount(
            diaryId
        )
        return likeclick
    }
}
import joi from "joi";

const usernamePattern = /^[가-힣a-zA-Z0-9]{2,10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;

const commentPattern = /^.{1,200}$/
const contentPattern = /^.{1,200}$/

const UserInfoSchema = joi.object({
  username: joi.string().pattern(usernamePattern),
  password: joi.string().pattern(passwordPattern),
  email: joi.string().email(),
  Authenticationcode: joi.string(),
});

const CommentSchema = joi.object({
  content: joi.string().pattern(commentPattern),
  diaryId: joi.number().integer(),
  commentId: joi.number().integer()
})

const DiarySchema = joi.object({
  diaryId : joi.number().integer(),
  EmotionStatus : joi.number(),
  content : joi.string().pattern(contentPattern),
  isPublic : joi.boolean(),
  weather : joi.string(),
  sentence : joi.string(),
  temperature : joi.string(),
  humid : joi.string(),
  sleep : joi.string()
})

export { UserInfoSchema, CommentSchema, DiarySchema };
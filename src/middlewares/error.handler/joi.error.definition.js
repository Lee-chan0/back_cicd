import joi from "joi";

const validAccountInfo = joi.object({
  nickname: joi.string().min(3).max(20),
  password: joi.string(),
  job: joi.string(),
  email: joi.string().email()
});



export { validAccountInfo };

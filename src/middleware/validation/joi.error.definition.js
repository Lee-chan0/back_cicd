import joi from "joi";

const usernamePattern = /^[가-힣a-zA-Z0-9]{2,10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;

const UserInfoSchema = joi.object({
  username: joi.string().pattern(usernamePattern),
  password: joi.string().pattern(passwordPattern),
  email: joi.string().email(),
  Authenticationcode: joi.string(),
});

export { UserInfoSchema };
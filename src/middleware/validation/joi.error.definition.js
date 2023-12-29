import joi from "joi";

// password = 8~20자의 소문자 숫자 특수문자를 포함

const UserInfoSchema = joi.object({
  username: joi.string().min(3).max(20),
  password: joi.string().min(8).max(20).pattern(new RegExp("^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])")),
  email: joi.string().email(),
});

export { UserInfoSchema }
;
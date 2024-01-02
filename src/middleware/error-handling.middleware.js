export default function (err, req, res, next) {
  console.error(err);
  if(err.name === "TokenExpiredError"){
    return res.status(419).json({message: "토큰이 만료 되었습니다."})
  }else if(err.name === "ValidationError"){
    return res.status(402).json({message : "Joi ::: 올바른 요청이 필요합니다."})
  }
  return res.status(500).json({ errorMessage: '서버 내부 에러가 발생했습니다.' });
}
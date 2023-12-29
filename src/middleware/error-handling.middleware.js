export default function (err, req, res, next) {
  console.error(err);
  if(err.name === "TokenExpiredError"){
    return res.status(419).json({message: "토큰이 만료 되었습니다."})
  }
  return res.status(500).json({ errorMessage: '서버 내부 에러가 발생했습니다.' });
}
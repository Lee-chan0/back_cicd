export default function (err, req, res, next) {
  console.error(err);
  if(err.name === `TokenExpiredError`){
    return res.status(419).json({message : 'AccessToken이 만료되었습니다.'});
  }
  res.status(err.status || 500).json({message : err.message})
}
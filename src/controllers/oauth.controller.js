import { OauthService } from "../services/oauth.service.js";

export class OauthController {
    oauthService = new OauthService();
    kakaoSignUpOrSignIn = async(req, res, next) => {
        try{
            const {code} = req.body;

            const result = await this.oauthService.kakaoSignupOrSignin(code);

            console.log(result.findUser)

            if(result.findUser.deletedAt){
                return res.status(403).json({data : result.findUser.email, message : "탈퇴처리중입니다. 취소하시겠습니까?"})
            }
            if(result.findUser){
                res.setHeader("Authorization", `Bearer ${result.accesstoken}`);
                res.setHeader("Refreshtoken", result.refreshtoken);
                return res.json({message : `${result.findUser.username}님 환영합니다.`});
            }
            res.setHeader("Authorization", `Bearer ${accesstoken}`);
            res.setHeader("Refreshtoken", refreshtoken);
            return res.json({message : "회원가입이 완료되었습니다."});
        }catch(err){
            next(err);
        }
    }

    googleSignUpOrSignIn = async(req, res, next) => {
        try{
            const {code} = req.body;

            const result = await this.oauthService.googleSignupOrSignin(code);
            if(result.findUser){
                res.setHeader("Authorization", `Bearer ${result.accesstoken}`);
                res.setHeader("Refreshtoken", result.refreshtoken);
                return res.json({message : `${result.findUser.username}님 환영합니다.`});
            }
            res.setHeader("Authorization", `Bearer ${result.accesstoken}`);
            res.setHeader("Refreshtoken", result.refreshtoken);
            return res.json({message : "회원가입이 완료되었습니다."});
        }catch(err){
            next(err);
        }
    }

    naverSignUpOrSignIn = async(req, res, next) => {
        try{
            const {code, state} = req.body;

            const result = await this.oauthService.naverSignupOrSignin(code, state);
            if(result.findUser){
                res.setHeader("Authorization", `Bearer ${result.accesstoken}`);
                res.setHeader("Refreshtoken", result.refreshtoken);
                return res.json({message : `${result.findUser.username}님 환영합니다.`});
            }
            res.setHeader("Authorization", `Bearer ${result.accesstoken}`);
            res.setHeader("Refreshtoken", result.refreshtoken);
            return res.json({message : "회원가입이 완료되었습니다."});
        }catch(err){
            next(err);
        }
    }
}
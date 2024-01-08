import express from 'express';
import {OauthController} from '../controllers/oauth.controller.js';

const router = express.Router();

const oauthController = new OauthController();

router.post('/kakao/callback', oauthController.kakaoSignUpOrSignIn);
router.post('/google/callback', oauthController.googleSignUpOrSignIn);
router.post('/naver/callback', oauthController.naverSignUpOrSignIn);

export default router;
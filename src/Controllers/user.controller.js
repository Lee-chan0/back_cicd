import UserModel from '../models/user.js'

const userController = {}

userController.saveUser=async(userName, sid, res)=>{
    // 이미 있는 유저인지 확인
    try {
        
        let user = await UserModel.findOne({ name: userName });
        // 없다면 새로 유저 정보 만들기
        if(!user){
            user = new UserModel({
                name:userName,
                token:sid,
                online:true,
            })
        }
        // 이미 있는 유저라면 연결 정보 token값만 바꿔주자
        if (user) {
            user.token = sid
            user.online=true
        }
        
        await user.save();
        return user;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

userController.checkUser = async(sid, res) => {
    try {
        const user = await UserModel.findOne({token:sid})
        console.log(user)
        // if(!user) throw new Error("user not found")
        return user
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

export default userController
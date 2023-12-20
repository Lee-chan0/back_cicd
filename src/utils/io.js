import userController from '../Controllers/user.controller.js'
import chatController from '../Controllers/chat.controller.js';

export default function(io){
    //io에 관련된 모든 작업
    io.on("connection", async(socket)=>{
        console.log("client is connected",socket.id)

        socket.on("login", async(userName, cb)=>{
            //유저정보를 저장
            try{
                const user = await userController.saveUser(userName, socket.id)
                const welcomeMessage = {
                    chat: `${user.name} has joined the chat room`,
                    user: { id: null, name: "system"},
                };
                io.emit("message", welcomeMessage);
                cb({ok:true, data:user})
            }catch(error) {
                cb({ok:false, error: error.message })
            }
        })

        socket.on("sendMessage", async(message, cb)=>{
            try{
            // socket.id로 유저 찾기
            const user= await userController.checkUser(socket.id)
            // 메세지 저장(유저 정보와 함께)
            const newMessage = await chatController.saveChat(message, user)
            io.emit("message", newMessage)
            cb({ok:true})
            }catch(error) {
                cb({ok:false, error: error.message })
            }
        })

        socket.on("disconnect", async()=>{
            const userName = await userController.checkUser(socket.id)
            if (userName) {
                const leavingMessage = {
                    chat: `${userName.name} has left the chat room`,
                    user: { id: null, name: "system"},
                };
                io.emit("message", leavingMessage)
                delete socket.id
            }
        })
    });
};
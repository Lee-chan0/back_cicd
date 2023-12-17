import express from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import bodyParser from 'body-parser'

// export const options = {
//     definition: {
//       openapi: "3.1.0",
//       info: {
//         title: "LogRocket Express API with Swagger",
//         version: "0.1.0",
//         description:
//           "This is a simple CRUD API application made with Express and documented with Swagger",
//         license: {
//           name: "MIT",
//           url: "https://spdx.org/licenses/MIT.html",
//         },
//         contact: {
//           name: "LogRocket",
//           url: "https://logrocket.com",
//           email: "info@email.com",
//         },
//       },
//       servers: [
//         {
//           url: "http://localhost:3000",
//         },
//       ],
//     },
//     apis: ["./routes/*.js"],
//   };
  
  export const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "감정일기",
        version: "1.0.0",
        description: "일반 로그인, OAuth로그인, 토큰 재발급 API에선 모두 A/T와 R/T를 응답 헤더에 담아서 전송합니다.",
      },
    },
    apis: ["./src/routes/*.js"],
  };

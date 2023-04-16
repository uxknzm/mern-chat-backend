import bodyParser from "body-parser";
import express from "express";
import socket from "socket.io";
import cors from "cors";
import { updateLastSeen, checkAuth } from "../middlewares";
import { loginValidation, registerValidation } from "../utils/validations";

import multer from "./multer";

import {
  UserCtrl,
  DialogCtrl,
  MessageCtrl,
  UploadFileCtrl,
} from "../controllers";

const createRoutes = (app: express.Express, io: socket.Server) => {
  
  const UserController = new UserCtrl(io);
  const DialogController = new DialogCtrl(io);
  const MessageController = new MessageCtrl(io);
  const UploadFileController = new UploadFileCtrl();

  app.use(bodyParser.json());
  app.use(express.json());
  app.use(checkAuth);
  app.use(updateLastSeen);
  app.use(cors({ origin: "*" }));
  app.all('*', function (req, res, next) {
    console.log(req.headers.origin);
    
    // res.header("Access-Control-Allow-Origin", req.headers.origin?.toString()); // Переход от исходного * к источнику текущего запроса
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,token");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.header("Access-Control-Allow-Credentials", "true"); // Разрешить отправку файлов cookie
    next();
  });

  app.get("/", (_: express.Request, res: express.Response) => {
    res.send("Hello, World!");
  });

  app.get("/user/me", UserController.getMe);
  app.post("/user/:id/avatar", multer.single("file"), UserController.changeAvatar);
  app.get("/user/verify", UserController.verify);
  app.post("/user/signup", registerValidation, UserController.create);
  app.post("/user/signin", loginValidation, UserController.login);
  app.get("/user/find", UserController.findUsers);
  app.get("/users", UserController.getAllUsers);
  app.get("/user/:id", UserController.show);
  app.delete("/user/:id", UserController.delete);

  app.get("/dialogs", DialogController.index);
  app.delete("/dialogs/:id", DialogController.delete);
  app.post("/dialogs", DialogController.create);

  app.get("/messages", MessageController.index);
  app.post("/messages", MessageController.create);
  app.delete("/messages", MessageController.delete);

  app.post("/files", multer.single("file"), UploadFileController.create);
  app.delete("/files", UploadFileController.delete);
};

export default createRoutes;

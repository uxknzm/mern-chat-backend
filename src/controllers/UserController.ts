import express from "express";
import bcrypt from "bcrypt";
import socket from "socket.io";
import { validationResult, Result, ValidationError } from "express-validator";
import { CourierClient } from "@trycourier/courier";

import { UserModel } from "../models";
import { IUser } from "../models/User";
import { createJWToken } from "../utils";
import cloudinary from "../core/cloudinary";
import UploadFileModel, { IUploadFile, IUploadFileDocument } from "../models/UploadFile";

class UserController {
  io: socket.Server;

  constructor(io: socket.Server) {
    this.io = io;
  }

  show = (req: express.Request, res: express.Response): void => {
    const id: string = req.params.id;
    UserModel.findById(id, (err: any, user: IUser) => {
      if (err) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      res.json(user);
    });
  };

  getMe = (req: express.Request, res: express.Response): void => {
    const id: string = req.user && req.user._id;
    UserModel.findById(id, (err: any, user: IUser) => {
      if (err || !user) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      res.json(user);
    });
  };

  findUsers = (req: express.Request, res: express.Response): void => {
    const query: string = req.query.query;
    UserModel.find()
      .or([
        { fullname: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
      ])
      .then((users: IUser[]) => res.json(users))
      .catch((err: any) => {
        return res.status(404).json({
          status: "error",
          message: err,
        });
      });
  };

  getAllUsers = (req: express.Request, res: express.Response): void => {
    console.log(req);
    UserModel.find({})
      .then((users: IUser[]) => res.json(users));
  };

  delete = (req: express.Request, res: express.Response): void => {
    const id: string = req.params.id;
    UserModel.findOneAndRemove({ _id: id })
      .then((user: IUser | null) => {
        if (user) {
          res.json({
            message: `User ${user.fullname} deleted`,
          });
        } else {
          res.status(404).json({
            status: "error",
          });
        }
      })
      .catch((err: any) => {
        res.json({
          message: err,
        });
      });
  };

  create = (req: express.Request, res: express.Response): void => {
    const postData: { email: string; fullname: string; password: string } = {
      email: req.body.email,
      fullname: req.body.fullname,
      password: req.body.password,
    };

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      UserModel.create(postData)
        .then((obj: IUser) => {
          res.json(obj);
          const courier = CourierClient({ authorizationToken: String(process.env.AUTH_TOKEN) });
          courier.send({
            message: {
              to: {
                email: postData.email,
              },
              template: String(process.env.TEMPLATE),
              data: {
                firstName: postData.fullname,
                link: `${String(process.env.DOMAIN)}/signup/verify?hash=${obj.confirm_hash}`,
                contactEmail: String(process.env.EMAIL),
                OrganizationName: String(process.env.ORGANIZATION),
              },
            }
          })
            .then(() => {
              console.log("send!!!");
            })
            .catch((err) => {
              console.log(err, "err");
            })
        })
        .catch((reason) => {
          res.status(500).json({
            status: "error",
            message: reason,
          });
        });
    }
  };

  verify = (req: express.Request, res: express.Response): void => {
    const hash: string = req.query.hash;

    if (!hash) {
      res.status(422).json({ errors: "Invalid hash" });
    } else {
      UserModel.findOne({ confirm_hash: hash }, (err: any, user: IUser) => {
        if (err || !user) {
          return res.status(404).json({
            status: "error",
            message: "Hash not found",
          });
        }

        user.confirmed = true;
        user.save((err: any) => {
          if (err) {
            return res.status(404).json({
              status: "error",
              message: err,
            });
          }

          res.json({
            status: "success",
            message: "Аккаунт успешно подтвержден!",
          });
        });
      });
    }
  };

  login = (req: express.Request, res: express.Response): void => {
    const postData: { email: string; password: string } = {
      email: req.body.email,
      password: req.body.password,
    };

    const errors: Result<ValidationError> = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      UserModel.findOne({ email: postData.email }, (err, user: IUser) => {
        if (err || !user) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        if (bcrypt.compareSync(postData.password, user.password)) {
          const token = createJWToken(user);
          res.json({
            status: "success",
            token,
          });
        } else {
          res.status(403).json({
            status: "error",
            message: "Incorrect password or email",
          });
        }
      });
    }
  };

  changeAvatar = (req: express.Request, res: express.Response): void => {
    const id: string = req.user._id;
    const file: any = req.file;

    cloudinary.v2.uploader
      .upload_stream(
        { resource_type: "auto" },
        (
          error: cloudinary.UploadApiErrorResponse | undefined,
          result: cloudinary.UploadApiResponse | undefined
        ) => {
          if (error || !result) {
            return res.status(500).json({
              status: "error",
              message: error || "upload error",
            });
          }

          const fileData: Pick<
            cloudinary.UploadApiResponse,
            "filename" | "size" | "ext" | "url" | "user"
          > = {
            filename: result.original_filename,
            size: result.bytes,
            ext: result.format,
            url: result.url,
            user: id,
          };

          const uploadFile: IUploadFileDocument = new UploadFileModel(fileData);

          uploadFile
            .save()
            .then((fileObj: IUploadFile) => {
              UserModel.findOneAndUpdate({ _id: id }, { avatar: fileObj.url }).then(() => {
                return res.json({
                  status: "success",
                  fileUrl: fileObj.url,
                });
              });
            })
            .catch((err: any) => {
              res.json({
                status: "error",
                message: err,
              });
            });
        }
      )
      .end(file.buffer);
  };
}

export default UserController;

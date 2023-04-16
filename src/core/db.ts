import mongoose from "mongoose";

mongoose.set('strictQuery', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.
  connect(process.env.DB_CONNECT || "")
  .then(() => console.log("success"))
  .catch((err) => console.log("err", err));

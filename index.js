import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { authRouter } from "./routers/authRouter.js";
import { userRouter } from "./routers/userRouter.js";
import { productRouter } from "./routers/productRouter.js";
import { cartRouter } from "./routers/cartRouter.js";
import { orderRouter } from "./routers/orderRouter.js";
import { stripeRouter } from "./routers/stripeRouter.js";

const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());

const PORT = process.env.PORT;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("connected to db"))
  .catch((err) => console.log(err));

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/product", productRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/checkout", stripeRouter);

app.listen(PORT, () => {
  console.log("Server started", PORT);
});

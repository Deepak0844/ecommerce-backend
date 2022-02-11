import express from "express";
import { verifyToken, authorization, isAdmin } from "../middleware/auth.js";
import Cart from "../models/Cart.js";
const router = express.Router();

//create cart(anybody who logged in)
router.post("/", verifyToken, async (request, response) => {
  const { userId } = request.body;
  if (!userId) {
    response.send({ message: "userId is required" });
    return;
  }
  const newCart = new Cart(request.body);
  const addCart = await newCart.save();
  response.send(addCart);
});

//update cart
router.put("/:id", authorization, async (request, response) => {
  const updateCart = await Cart.findByIdAndUpdate(
    request.params.id,
    {
      $set: request.body,
    },
    { new: true }
  );
  response.send(updateCart);
});

//delete cart
router.delete("/:id", authorization, async (request, response) => {
  const deleteCart = await Cart.findByIdAndDelete(request.params.id);
  response.send({ message: "cart item deleted successfully" });
});

//get cart by user
router.get("/:userId", authorization, async (request, response) => {
  const cartByUser = await Cart.findOne({ userId: request.params.userId });
  response.send(cartByUser);
});

//get all cart(only admin allowed)
router.get("/", isAdmin, async (request, response) => {
  const allCart = await Cart.find();
  response.send(allCart);
});
export const cartRouter = router;

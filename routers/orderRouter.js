import express from "express";
import Order from "../models/Order.js";
import { verifyToken, authorization, isAdmin } from "../middleware/auth.js";
const router = express.Router();

//create order(anubody who logged in)
router.post("/", verifyToken, async (request, response) => {
  const { userId, amount, address } = request.body;

  if (!userId) {
    response.send({ message: "userId is required" });
    return;
  }
  if (!amount) {
    response.send({ message: "amount is required" });
    return;
  }
  if (!address) {
    response.send({ message: "address is required" });
    return;
  }
  const newOrder = new Order(request.body);
  const saveOrder = await newOrder.save();
  response.send(saveOrder);
});

//update order(only admin)
router.put("/:id", isAdmin, async (request, response) => {
  const updateOrder = await Order.findByIdAndUpdate(
    request.params.id,
    {
      $set: request.body,
    },
    { new: true }
  );
  response.send(updateOrder);
});

//delete order(only admin)
router.delete("/:id", isAdmin, async (request, response) => {
  const deleteOrder = await Order.findByIdAndDelete(request.params.id);
  response.send({ message: "Order has been deleted" });
});

//get order by user
router.get("/find/:userId", verifyToken, async (request, response) => {
  const orderByUser = await Order.find({ userId: request.params.userId });
  response.send(orderByUser);
});

//get all cart(only admin)
router.get("/", isAdmin, async (request, response) => {
  const allOrder = await Order.find();
  response.send(allOrder);
});

//monthly income
router.get("/income", isAdmin, async (request, response) => {
  const date = new Date();
  const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
  const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

  const income = await Order.aggregate([
    { $match: { createdAt: { $gte: previousMonth } } },
    {
      $project: {
        month: { $month: "$createdAt" },
        sales: "$amount",
      },
    },
    {
      $group: {
        _id: "$month",
        total: { $sum: "$sales" },
      },
    },
  ]);
  response.send(income);
});

export const orderRouter = router;

import express from "express";
import { genPassword } from "../helper.js";
import { authorization, isAdmin } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

//update user(admin and account owner)
router.put("/:id", authorization, async (request, response) => {
  const { id } = request.params;
  if (
    request.body.password &&
    !/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@!#%&]).{8,}$/g.test(
      request.body.password
    )
  ) {
    response.status(401).send({ message: "Password pattern does not match" });
    return;
  }

  if (request.body.password) {
    request.body.password = await genPassword(request.body.password);
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      { _id: id },
      { $set: request.body },
      { new: true }
    );
    response.send(updatedUser);
  } catch (err) {
    response.send(err);
  }
});

//delete user by id(admin and account owner)
router.delete("/:id", authorization, async (request, response) => {
  try {
    await User.findByIdAndDelete(request.params.id);
    response.send({ message: "user deleted successfully" });
  } catch (err) {
    response.send(err);
  }
});

//get all users(only admin is allowed)
router.get("/", isAdmin, async (request, response) => {
  const query = request.query.new;
  try {
    const allUser = query
      ? await User.find().sort({ _id: -1 }).limit(5)
      : await User.find();
    response.send(allUser);
  } catch (err) {
    response.send(err);
  }
});

//user by id(only admin is allowed)
router.get("/find/:id", isAdmin, async (request, response) => {
  const { id } = request.params;
  try {
    const user = await User.findById({ _id: id });

    const { password, ...others } = user._doc;
    response.send(others);
  } catch (err) {
    response.send(err);
  }
});

//user stats(only admin is allowed)
router.get("/stats", isAdmin, async (request, response) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));
  try {
    const stats = await User.aggregate([
      {
        $match: { createdAt: { $gte: lastYear } },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    response.send(stats);
  } catch (err) {
    response.send(err);
  }
});
export const userRouter = router;

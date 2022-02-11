import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    products: { type: Array, required: true },
    total: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Cart", CartSchema, "cart");

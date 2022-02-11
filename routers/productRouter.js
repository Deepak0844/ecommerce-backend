import express from "express";
import { isAdmin } from "../middleware/auth.js";
import Product from "../models/Product.js";
const router = express.Router();

//create product(only admin is allowed)
router.post("/", isAdmin, async (request, response) => {
  const { title, description, image, categories, size, colour, price } =
    request.body;

  const titleFromDb = await Product.findOne({ title });
  if (titleFromDb) {
    response.send({ message: "title already exist" });
    return;
  }

  if (!title) {
    response.send({ message: "title should be provided" });
    return;
  }
  if (!description) {
    response.send({ message: "description should be provided" });
    return;
  }
  if (!image) {
    response.send({ message: "image should be provided" });
    return;
  }
  if (!size) {
    response.send({ message: "size should be provided" });
    return;
  }
  if (!colour) {
    response.send({ message: "colour should be provided" });
    return;
  }
  if (!price) {
    response.send({ message: "price should be provided" });
    return;
  }
  const product = new Product(request.body);
  const newProduct = await product.save();
  response.send(newProduct);
});

//update product(only admin is allowed)
router.put("/:id", isAdmin, async (request, response) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    request.params.id,
    { $set: request.body },
    { new: true }
  );
  response.send(updatedProduct);
});

//delete product(only admin is allowed)
router.delete("/:id", isAdmin, async (request, response) => {
  const updatedProduct = await Product.findByIdAndDelete(request.params.id);
  response.send({ message: "Product deleted successfully" });
});

//get product
router.get("/", async (request, response) => {
  const productsByDate = request.query.new;
  const productsBycategory = request.query.category;
  let products;

  if (productsByDate) {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);
  } else if (productsBycategory) {
    products = await Product.find({
      categories: {
        $in: [productsBycategory],
      },
    });
  } else {
    products = await Product.find();
  }

  response.send(products);
});

//get product by id
router.get("/:id", async (request, response) => {
  const product = await Product.findById(request.params.id);
  response.send(product);
});

export const productRouter = router;

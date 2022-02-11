import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_KEY);

router.post("/payment", (request, response) => {
  stripe.charges.create(
    {
      source: request.body.tokenId,
      amount: request.body.amount,
      currency: "usd",
    },
    (stripeErr, stripeRes) => {
      if (stripeErr) {
        response.send(stripeErr);
      } else {
        response.send(stripeRes);
      }
    }
  );
});

export const stripeRouter = router;

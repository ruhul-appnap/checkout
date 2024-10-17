import Stripe from "stripe";

const stripe = new Stripe("private-key");
export default async function handler(req, res) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "EUR",
      amount: 1999,
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
}

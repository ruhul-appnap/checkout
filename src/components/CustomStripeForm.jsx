import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import CardIcon from "./CardIcon";

// Replace with your publishable key
const stripePromise = loadStripe("public-key");

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#9e2146" },
  },
};

function StripeForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [saveCard, setSaveCard] = useState(false);
  const [cardBrand, setCardBrand] = useState(null);
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  const handleChange = (event) => {
    const { elementType, error, complete, brand } = event;
    setErrors((prev) => ({
      ...prev,
      [elementType]: error ? error.message : "",
    }));
    setIsComplete((prev) => ({ ...prev, [elementType]: complete }));
    if (brand) setCardBrand(brand);
  };

  const isFormComplete = Object.values(isComplete).every(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !isFormComplete) return;

    setIsProcessing(true);

    try {
      // Create a payment intent by requesting it from your server
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        body: {},
      });
      const { clientSecret } = await res.json();

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: { name: "ruhul", email: "ruhul@amin.com" },
          },
          return_url: `${window.location.origin}/completion`,
        }
      );

      if (error) {
        setErrors({ cardNumber: error.message });
      } else if (paymentIntent.status === "succeeded") {
        window.location.href = "/success"; // Redirect on success
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setErrors({
        general:
          "An error occurred during payment processing. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full md:max-w-md mx-auto mt-32">
      {/* Card Number Input */}
      <div className="mb-4 relative">
        <CardNumberElement
          options={ELEMENT_OPTIONS}
          onChange={handleChange}
          className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <CardIcon brand={cardBrand} />
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry Date and CVC Inputs */}
      <div className="flex mb-4 -mx-2">
        <div className="w-1/2 px-2">
          <CardExpiryElement
            options={ELEMENT_OPTIONS}
            onChange={handleChange}
            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.cardExpiry && (
            <p className="mt-1 text-sm text-red-600">{errors.cardExpiry}</p>
          )}
        </div>
        <div className="w-1/2 px-2">
          <CardCvcElement
            options={ELEMENT_OPTIONS}
            onChange={handleChange}
            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.cardCvc && (
            <p className="mt-1 text-sm text-red-600">{errors.cardCvc}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !isFormComplete}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : "Confirm payment • $12.80"}
      </button>

      {/* General Errors */}
      {errors.general && (
        <p className="mt-4 text-sm text-red-600">{errors.general}</p>
      )}

      {/* Info Text */}
      <p className="mt-2 text-xs text-gray-500">
        By pressing the "Confirm payment" button, you agree to Preply's Refund
        and Payment Policy.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        It's safe to pay on Preply. All transactions are protected by SSL
        encryption.
      </p>
    </form>
  );
}

export default function CustomStripeForm() {
  return (
    <Elements stripe={stripePromise}>
      <StripeForm />
    </Elements>
  );
}

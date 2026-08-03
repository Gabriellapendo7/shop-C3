// Payment channels supported by Mctaba Shop.
// These map the internal paymentChannel values (stored in the DB and sent
// to Paystack) to the labels and colours shown to customers and admins.
//
// Adding a new channel: add one entry here. The checkout page, order
// confirmation page, and admin dashboard all read from this file.
export const PAYMENT_CHANNELS = {
  card: {
    label: "Debit / Credit Card",
    shortLabel: "Card",
    description: "Visa, Mastercard",
    paystackChannels: ["card"],
  },
  mobile_money: {
    label: "M-Pesa / Airtel Money",
    shortLabel: "Mobile Money",
    description: "Pay via M-Pesa STK push or Airtel Money PIN",
    paystackChannels: ["mobile_money"],
  },
};

// The values customers see when choosing a payment method.
// Used in <select> or radio groups.
export const CHANNEL_OPTIONS = Object.entries(PAYMENT_CHANNELS).map(
  ([value, config]) => ({ value, label: config.label })
);

// Human-readable label for a stored payment channel value.
// Used on the order page and admin dashboard.
export function channelLabel(channel) {
  return PAYMENT_CHANNELS[channel]?.label ?? channel;
}

// The Paystack channels array to pass to initializeTransaction.
// Maps our internal channel key to Paystack's channel identifiers.
export function paystackChannels(channel) {
  return PAYMENT_CHANNELS[channel]?.paystackChannels ?? [channel];
}
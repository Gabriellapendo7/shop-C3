import * as orderRepository from "#repositories/orderRepository.js";

// The order page needs the order and its line items together.
// Returns null when the reference is unknown, so the route can 404.
export async function findOrderWithItems(reference) {
  const order = await orderRepository.findByReference(reference);
  if (!order) return null;

  const items = await orderRepository.findItemsByOrderId(order.id);
  return { order, items };
}

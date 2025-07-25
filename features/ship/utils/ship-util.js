import shippo from "shippo";

import ordersModel from "../../orders/orders.model.js";
import logger from "../../../utils/logger.js";
import shippoClient from "../shippo-client.js";



export const createShippoLabel = async (order) => {
  logger.info("Creating Shippo shipment...");

  // 1. Create addresses
  const toAddress = {
    name: `${order.userDetails.firstName} ${order.userDetails.lastName}`,
    street1: order.userDetails.address,
    city: order.userDetails.state,
    state: order.userDetails.state,
    zip: order.userDetails.zip,
    country: order.userDetails.country,
    phone: order.userDetails.phone,
    email: order.userDetails.email,
  };

  const fromAddress = {
    name: "Your Business Name",
    street1: "Your Address",
    city: "Your City",
    state: "Your State",
    zip: "Your Zip",
    country: "US",
    phone: "1234567890",
    email: "you@example.com",
  };

  // 2. Determine dimensions
  const totalQuantity = order.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const dimensions = getDimensionsByQuantity(totalQuantity);

  // 3. Calculate weight (in ounces)
  const totalWeight = order.cartItems.reduce((sum, item) => sum + (item.weight || 0), 0);

  const parcel = {
    length: dimensions.length,
    width: dimensions.width,
    height: dimensions.height,
    distance_unit: "in",
    weight: totalWeight || 16,
    mass_unit: "oz",
  };

  // 4. Create shipment and get rates
  const shipment = await shippoClient.shipment.create({
    address_from: fromAddress,
    address_to: toAddress,
    parcels: [parcel],
    async: false,
  });

  // 5. Choose the first rate or filter by carrier
  const selectedRate = shipment.rates.find(rate => rate.provider === "USPS");

  // 6. Buy label
  const transaction = await shippoClient.transaction.create({
    rate: selectedRate.object_id,
    label_file_type: "PDF",
    async: false,
  });

  // 7. Save label to order
    await ordersModel.findByIdAndUpdate(order._id, {
    labelUrl: transaction.label_url,
    trackingNumber: transaction.tracking_number,
    status: "label_created",
  });

  return transaction;
};

export const getDimensionsByQuantity = (quantity) => {
  if (quantity === 1) return { length: 8, width: 6, height: 4 };
  if (quantity === 2) return { length: 12, width: 9, height: 6 };
  if (quantity === 3) return { length: 12, width: 10, height: 8 };
  if (quantity === 4) return { length: 19, width: 14, height: 17 };
  if (quantity === 5) return { length: 10, width: 10, height: 10 };
  return { length: 12, width: 12, height: 12 };
};

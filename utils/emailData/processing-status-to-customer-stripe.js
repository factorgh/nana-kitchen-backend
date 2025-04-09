import moment from "moment";

export const processingCustomerStripe = (
  order,
  shippingDetails,
  totalItemsCost
) => {
  // calculate subtotal
  const subtotal = order.cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // get recipients (assuming order.userDetails.email contains the customer's email)
  const recipients = order.userDetails.email;

  // generate order details
  const orderDetails = order.cartItems.map((item) => ({
    title: item.title,
    price: item.price,
    quantity: item.quantity,
  }));

  const sliceOrderId = order._id.toString().slice(-6);

  // returning email object
  return {
    to: recipients,
    from: "info@nanaskitchen.com",
    subject: "Your Nana's Kitchen order has been processed!",
    html: `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #e74c3c; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Order Confirmation</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; line-height: 1.5;">
            Hi ${order.userDetails.firstName} ${order.userDetails.lastName},<br>
            Your order <strong>#${sliceOrderId}</strong> has been successfully processed. Thank you for choosing Nana's Kitchen!
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f9f9f9;">
                <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Product</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #ddd;">Quantity</th>
                <th style="text-align: right; padding: 10px; border: 1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetails
                .map(
                  (item) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    item.title
                  }</td>
                  <td style="text-align: center; padding: 10px; border: 1px solid #ddd;">${
                    item.quantity
                  }</td>
                  <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">$${(
                    item.price * item.quantity
                  ).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Subtotal:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${subtotal.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Shipping:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${shippingDetails}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Total:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${totalItemsCost.toFixed(
                  2
                )}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: left;">
          <h3>Delivery Details</h3>
          <p><strong>Name:</strong> ${order.userDetails.firstName} ${
      order.userDetails.lastName
    }</p>
          <p><strong>Address:</strong> ${order.userDetails.address}</p>
          <p> <strong>City:</strong> ${order.userDetails.city}</p>
         
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #7f8c8d; margin: 0;">&copy; 2024 Nana's Kitchen. All rights reserved.</p>
        </div>
      </div>
    </div>
  `,
  };
};

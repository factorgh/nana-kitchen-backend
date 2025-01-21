import moment from "moment";

export const processingStatusToAdmin = (
  client,
  admins,
  order,
  totalItemsCost
) => {
  // calculate subtotal
  const subtotal = order.cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // generate order details
  const orderDetails = order.cartItems.map((item) => ({
    title: item.title,
    price: item.price,
    quantity: item.quantity,
  }));

  const calculatedDelveryPrice = order.totalAmount - subtotal;

  const sliceOrderId = order._id.toString().slice(-6);

  return {
    to: client,
    cc: admins,
    from: "info@nanaskitchen.com",
    subject: `Ghana-[Nana's Kitchen]: New order ${sliceOrderId}`,
    html: `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #e74c3c; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Ghana-New Order:#${sliceOrderId}</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; line-height: 1.5;">
          
           You've received the following order from ${
             order.userDetails.firstName + " " + order.userDetails.lastName
           } .<br>

          </p>
          <h2 style="color: #e74c3c;">[Order #${sliceOrderId}] (${moment(
      order.createdAt
    ).format("MM/DD/YYYY")})</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
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
                  <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">GHC${(
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
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">GHC ${subtotal}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Delivery Fee:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">GHC ${calculatedDelveryPrice}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Subtotal:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">GHC ${
                  order.totalAmount
                }</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Payment method:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">Paystack</td>
              </tr>
              </tfoot>
          </table>
            </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: left;">
          <h3>Delivery Details</h3>
          <p><strong>Name:</strong> ${order.userDetails.firstName} ${
      order.userDetails.lastName
    }</p>
          <p><strong>Phone:</strong> ${order.userDetails.phone}</p>
          <p><strong>Address:</strong> ${order.userDetails.address}</p>
          
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #7f8c8d; margin: 0;">&copy; 2024 Nana's Kitchen. All rights reserved.</p>
        </div>
      </div>
    </div>
`,
  };
};

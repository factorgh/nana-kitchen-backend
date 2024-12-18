export const completedStatusToCustomer = (client) => {
  return {
    to: client,
    from: "info@nanaskitchen.com",
    subject: "Your Nana's Kitchen order has been received!",
    html: `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #e74c3c; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Thank you for your order</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; line-height: 1.5;">
            Hi Ernest,<br>
            Just to let you know — we’ve received your order <strong>#2731</strong>, and it is now being processed:
          </p>
          <p style="font-size: 16px; line-height: 1.5;">
            Pay with cash upon delivery.
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
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">16oz Black Shitor (Extra Hot)</td>
                <td style="text-align: center; padding: 10px; border: 1px solid #ddd;">1</td>
                <td style="text-align: right; padding: 10px; border: 1px solid #ddd;">$11.99</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Subtotal:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$11.99</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Shipping:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$27.33</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;" colspan="2">Total:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$39.32</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #7f8c8d; margin: 0;">&copy; 2024 Nana's Kitchen. All rights reserved.</p>
        </div>
      </div>        
    </div>
  `,
  };
};

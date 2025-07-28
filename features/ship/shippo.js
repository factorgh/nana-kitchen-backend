// controllers/shipping.controller.ts


import { Shippo } from 'shippo';
import shippoClient from './shippo-client.js';
import { getDimensionsByQuantity } from './utils/ship-util.js';
import {DistanceUnitEnum, WeightUnitEnum } from "shippo"

import dotenv from 'dotenv';
import ordersModel from '../orders/orders.model.js';
dotenv.config();

 const shippo = new Shippo({apiKeyHeader: process.env.SHIPPO_API_KEY_TEST});

export const getShippingRates = async (req, res) => {
  try {
    const { fromAddress, toAddress, order } = req.body;

    if (!fromAddress || !toAddress || !order?.cartItems?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log('fromAddress:', fromAddress);
    console.log('toAddress:', toAddress);
    console.log('order.cartItems:', order.cartItems);

    // Calculate total weight
    const totalWeight = order.cartItems.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    );

    const totalQuantity = order.cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const dimensions = getDimensionsByQuantity(totalQuantity);

    const parcel = {
      length: dimensions.length?.toString() || "5",
      width: dimensions.width?.toString() || "5",
      height: dimensions.height?.toString() || "5",
      distanceUnit: DistanceUnitEnum.In,
      weight: totalWeight.toString(),
      massUnit: WeightUnitEnum.Lb
    };

    const shipment = await shippo.shipments.create({
      addressFrom: {
        ...fromAddress,
        country: fromAddress.country?.toUpperCase() || 'US'
      },
      addressTo: {
        ...toAddress,
        country: toAddress.country?.toUpperCase() || 'US'
      },
      parcels: [parcel],
      async: false,
    });

  const groundAdvantageRates = shipment.rates.filter(
  (rate) => rate.provider === 'USPS' && rate.servicelevel.name === 'Ground Advantage'
);


    res.json({ rates: groundAdvantageRates, shipmentId: shipment.objectId });
  } catch (error) {
    console.log(error)
    console.error('Error fetching shipping rates:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    res.status(500).json({
      message: 'Failed to fetch rates',
      error: error.response?.data || error.message || error,
    });
  }
};



export const buyShippingLabel = async (req, res) => {
  try {
    const { rateObjectId,shipmentId  } = req.body;

    const transaction = await shippo.transactions.create({
      rate: rateObjectId,
      label_file_type: 'PDF',
      async: false,
    });

    if (transaction.status === 'SUCCESS') {
      res.json({
        tracking_number: transaction.trackingNumber,
        label_url: transaction.labelUrl,
        carrier: transaction.carrier,
        servicelevel: transaction.servicelevelName,
      });
    } else {
      res.status(400).json({ message: 'Label purchase failed', transaction });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to purchase label', error });
  }
};



export const generateLabelController = async (req, res) => {
  try {
    const {
      addressFrom,
      addressTo,
      parcel,
      orderId
    } = req.body;

    // Validate required fields
    if (!addressFrom || !addressTo || !parcel) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    // Get orderDetails
    const order = await ordersModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    // Check if user already has a label and a tracking number then return label 
    // If not the create a new label
    if (order.labelUrl && order.trackingNumber) {
      return res.status(200).json({
        labelUrl: order.labelUrl,
        trackingNumber: order.trackingNumber,
      });
    }
    

    const shipment = await shippo.shipments.create({
      addressFrom:addressFrom,
      addressTo:addressTo,
      parcels: [parcel],
      async: false,
    });

    if (!shipment || !shipment.objectId) {
      return res.status(500).json({ message: "Failed to create shipment." });
    }

    console.log("shipment",shipment.rates)
    // rates


    const transaction = await shippo.transactions.create({
      shipment: shipment,
      servicelevelToken:"usps_ground_advantage",
      carrierAccount:"8d93263e7d774b93aa59b372726172a4",
      // label_file_type: "PDF", // or PNG
      // async: false,
    });

    if (transaction.status !== "SUCCESS") {
      return res.status(500).json({ message: "Label generation failed.", transaction });
    }

    // update order
    await ordersModel.updateOne({ _id: orderId }, { labelUrl: transaction.labelUrl, trackingNumber: transaction.trackingNumber });

    return res.status(200).json({
      labelUrl: transaction.labelUrl,
      trackingNumber: transaction.trackingNumber,
    });
  } catch (error) {
    console.log(error)
    console.error("Label generation error:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const createTestShipment = async (req, res) => {
  try {
    const addressFrom = {
      name: "Shawn Ippotle",
      company: "Shippo",
      street1: "215 Clayton St.",
      city: "San Francisco",
      state: "CA",
      zip: "94117",
      country: "US",
      phone: "+1 555 341 9393",
      email: "shippotle@shippo.com",
    };

    const addressTo = {
      name: "Mr Hippo",
      company: "",
      street1: "Broadway 1",
      street2: "",
      city: "New York",
      state: "NY",
      zip: "10007",
      country: "US",
      phone: "+1 555 341 9393",
      email: "mrhippo@shippo.com",
      metadata: "Hippos dont lie"
    };

    const parcel = {
      length: "5",
      width: "5",
      height: "5",
      distanceUnit: DistanceUnitEnum.In,
      weight: "2",
      massUnit: WeightUnitEnum.Lb
    };

    const shipment = await shippoClient.shipments.create({
      addressFrom,
      addressTo,
      parcels: [parcel],
      async: false,
    });

    res.status(200).json({
      success: true,
      shipment,
    });
  } catch (error) {
    console.error('Error creating shipment:', error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      details: error?.response?.data,
    });
  }
};


export const createTestAddress = async (req, res) => {
  try {
   

    const { name, company, street1, city, state, zip, country, phone, email } = req.body;
    const shippo = new Shippo({apiKeyHeader: process.env.SHIPPO_API_KEY_TEST});

    const addressFrom = await shippo.addresses.create({
      name,
      company,
      street1,
      city,
      state,
      zip,
      country, // iso2 country code
      phone,
      email,
    });

    res.status(200).json({
      success: true,
      addressFrom,
    });
  } catch (error) {
    console.error('Error creating address:', error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      details: error?.response?.data,
    });
  }
};
      


// Json object for getting rates 
// {
//   "fromAddress": {
//     "name": "John Doe",
//     "street1": "123 Main St",
//     "city": "Los Angeles",
//     "state": "CA",
//     "zip": "90001",
//     "country": "US",
//     "phone": "1234567890",
//     "email": "john@example.com"
//   },
//   "toAddress": {
//     "name": "Jane Smith",
//     "street1": "456 Another St",
//     "city": "New York",
//     "state": "NY",
//     "zip": "10001",
//     "country": "US",
//     "phone": "0987654321",
//     "email": "jane@example.com"
//   },
//   "order": {
//     "cartItems": [
//       {
//         "name": "T-shirt",
//         "quantity": 2,
//         "weight": 1.2,
//         "length": 10,
//         "width": 7,
//         "height": 2
//       },
//       {
//         "name": "Shoes",
//         "quantity": 1,
//         "weight": 3.5,
//         "length": 12,
//         "width": 8,
//         "height": 5
//       }
//     ]
//   }
// }



// Object for label generation 

// {
//   "addressFrom": {
//     "name": "Shawn Ippotle",
//     "company": "Shippo",
//     "street1": "215 Clayton St.",
//     "city": "San Francisco",
//     "state": "CA",
//     "zip": "94117",
//     "country": "US",
//     "phone": "+1 555 341 9393",
//     "email": "shippotle@shippo.com"
//   },
// "addressTo": {
//   "name": "Mr Hippo",
//   "company": "",
//   "street1": "1 Broadway",
//   "city": "New York",
//   "state": "NY",
//   "zip": "10004",  // <- Updated to match official ZIP for 1 Broadway
//   "country": "US",
//   "phone": "+1 555 341 9393",
//   "email": "mrhippo@shippo.com",
//   "metadata": "Hippos dont lie"
// },
//   "parcel": {
//     "length": "5",
//     "width": "5",
//     "height": "5",
//     "distanceUnit": "in", 
//     "weight": "2",
//     "massUnit": "lb"
//   }
// }

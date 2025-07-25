import Easyship from 'easyship';
import dotenv from 'dotenv';
import getPackageDimensions from '../../../utils/getPackageDimensions.js';
import axios from 'axios';

dotenv.config();

const easyship = Easyship(process.env.EASYSHIP_API_KEY_TEST);

const EASYSHIP_API_KEY_TEST = process.env.EASYSHIP_API_KEY_TEST;

/**
 * Fetch shipping rates via Easyship
 */
export const getShippingRates = async (req, res) => {
  try {
    const { fromAddress, toAddress, order } = req.body;
    if (!fromAddress || !toAddress || !order?.cartItems?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const items = order.cartItems.map(item => ({
      actual_weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      category: item.category || 'general',
      declared_currency: order.currency || 'USD',
      declared_customs_value: item.declaredValue || 10,
    }));

    const rateRequest = {
      origin_postal_code: fromAddress.zip,
      origin_country_alpha2: fromAddress.country.toUpperCase(),
      destination_postal_code: toAddress.zip,
      destination_country_alpha2: toAddress.country.toUpperCase(),
      items,
      taxes_duties_paid_by: 'Sender',
      is_insured: false,
      apply_shipping_rules: true,
    };

    const { rates } = await easyship.rate.create(rateRequest);

    res.json({ rates });
  } catch (err) {
    console.error('Error fetching rates:', err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch rates", error: err.response?.data || err.message });
  }
};

/**
 * Create shipment and purchase label via Easyship
 */
export const buyShippingLabel = async (req, res) => {
  try {
    const { selectedRateId, fromAddress, toAddress, items } = req.body;
    if (!selectedRateId || !fromAddress || !toAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const createShipmentData = {
      from: {
        ...fromAddress,
        country_code: fromAddress.country.toUpperCase(),
      },
      to: {
        ...toAddress,
        country_code: toAddress.country.toUpperCase(),
      },
      items,
      selected_courier_rate_id: selectedRateId,
    };

    const shipment = await easyship.shipment.create(createShipmentData);
    const label = await easyship.shipment.createLabel(shipment.id, { format: 'PDF' });

    res.json({
      tracking_number: shipment.tracking_number,
      label_url: label.url,
      courier: shipment.courier_name,
      service: shipment.courier_service,
    });
  } catch (err) {
    console.error('Error buying label:', err.response?.data || err.message);
    res.status(500).json({ message: "Failed to purchase label", error: err.response?.data || err.message });
  }
};




export const getEasyshipRates = async (req, res) => {
  try {
    const {
      destination_country_alpha2,
      destination_state,
      destination_postal_code,
      destination_city,
      parcels,
    } = req.body;

    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      return res.status(400).json({ error: "At least one parcel is required." });
    }

    const requestBody = {
      destination_address: {
        country_alpha2: destination_country_alpha2,
        state: destination_state,
        postal_code: destination_postal_code,
        city: destination_city,
      },
      incoterms: "DDU",
      insurance: {
        is_insured: false,
      },
      courier_settings: {
        show_courier_logo_url: false,
        apply_shipping_rules: true,
      },
      shipping_settings: {
        units: {
          weight: "kg",
          dimensions: "cm",
        },
      },
      parcels: parcels.map((parcel) => ({
        origin_country_alpha2: parcel.origin_country_alpha2 || "US",
        quantity: parcel.quantity || 1,
        declared_currency: parcel.declared_currency || "USD",
        declared_customs_value: parcel.declared_customs_value || 10,
        description: parcel.description || "Item",
        weight: parcel.weight || 0.5,
        length: parcel.length || 10,
        width: parcel.width || 10,
        height: parcel.height || 10,
        contains_battery_pi966: !!parcel.contains_battery_pi966,
        contains_battery_pi967: !!parcel.contains_battery_pi967,
        contains_liquids: !!parcel.contains_liquids,
      })),
    };

    const response = await axios.post(
      "https://public-api.easyship.com/2024-09/rates",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${EASYSHIP_API_KEY_TEST}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("Failed to get Easyship rate:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to fetch rates",
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Returns appropriate package dimensions based on total quantity.
 * @param {number} totalQuantity - Total number of items in the shipment
 * @returns {{ units: string, length: number, width: number, height: number }}
 */
function getPackageDimensions(totalQuantity) {
  const boxSizes = {
    1: { units: 'inches', length: 8, width: 6, height: 4 },
    2: { units: 'inches', length: 12, width: 9, height: 6 },
    3: { units: 'inches', length: 12, width: 10, height: 8 },
    4: { units: 'inches', length: 19, width: 14, height: 17 },
    5: { units: 'inches', length: 10, width: 10, height: 10 },
  };

  return boxSizes[totalQuantity] || { units: 'inches', length: 12, width: 12, height: 12 };
}

export default getPackageDimensions;

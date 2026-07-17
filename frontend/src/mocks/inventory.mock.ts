export const mockInventory = [
  { id: '1', name: 'Premium Basmati Rice - 5kg', brand: 'Himalayan Pride', sku: 'RICE-HIM-005', category: 'Grains & Rice', stock: 124, unit: 'bags', reorderLevel: 20, cost: 850, price: 1120, status: 'In Stock' },
  { id: '2', name: 'Organic Full Cream Milk - 1L', brand: 'Dairy Fresh', sku: 'DAI-MILK-100', category: 'Dairy', stock: 12, unit: 'units', reorderLevel: 15, cost: 55, price: 78, status: 'Low Stock' },
  { id: '3', name: 'Himalayan Coffee Beans - 500g', brand: 'Hill Top Brews', sku: 'BEV-COFF-500', category: 'Beverages', stock: 0, unit: 'units', reorderLevel: 10, cost: 1200, price: 1650, status: 'Out of Stock' },
  { id: '4', name: 'Wai Wai Noodles - 12pk', brand: 'CG Foods', sku: 'NOOD-WAI-012', category: 'Snacks', stock: 245, unit: 'packs', reorderLevel: 50, cost: 18, price: 25, status: 'In Stock' },
  { id: '5', name: 'Coca Cola - 2.25L', brand: 'Coca Cola', sku: 'BEV-COKE-225', category: 'Beverages', stock: 45, unit: 'bottles', reorderLevel: 24, cost: 120, price: 150, status: 'In Stock' },
  { id: '6', name: 'Dhara Mustard Oil - 1L', brand: 'Dhara', sku: 'OIL-DHA-001', category: 'Cooking Oil', stock: 8, unit: 'pouches', reorderLevel: 12, cost: 180, price: 210, status: 'Low Stock' },
  { id: '7', name: 'Sugar - 1kg', brand: 'Local', sku: 'SUG-LOC-001', category: 'Grocery', stock: 150, unit: 'kg', reorderLevel: 30, cost: 95, price: 110, status: 'In Stock' },
  { id: '8', name: 'Lux Soap - 100g', brand: 'Unilever', sku: 'SOP-LUX-100', category: 'Personal Care', stock: 320, unit: 'pcs', reorderLevel: 50, cost: 35, price: 45, status: 'In Stock' },
];

export const mockInventoryStats = {
  totalProducts: 1248,
  lowStock: 42,
  outOfStock: 7,
  inventoryValue: 482500,
  growth: 12
};

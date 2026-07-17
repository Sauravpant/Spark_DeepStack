export const mockDashboardData = {
  stats: {
    totalRevenue: { value: 142500, trend: 12.5, data: [30, 40, 20, 60, 80, 50, 90] },
    grossProfit: { value: 42300, trend: 8.2, data: [20, 30, 40, 30, 50, 45, 60] },
    creditOutstanding: { value: 84200, trend: 4.1, data: [60, 55, 65, 70, 68, 75, 80] },
    inventoryValue: { value: 612000, trend: 0, data: [50, 50, 50, 50, 50, 50, 50] },
  },
  bestSelling: [
    { id: '1', name: 'Real Fruit Juice (1L)', units: 452, revenue: 113000, trend: 8 },
    { id: '2', name: 'Basmati Rice (5kg)', units: 215, revenue: 172000, trend: -2 },
    { id: '3', name: 'Wai Wai Noodles (12pk)', units: 1120, revenue: 22400, trend: 15 },
  ],
  inventoryAlerts: [
    { id: '1', name: 'Aashirvaad Atta (5kg)', status: 'Out of Stock', type: 'critical' },
    { id: '2', name: 'Dhara Mustard Oil', status: 'Expiring in 5 days (12 units)', type: 'warning' },
    { id: '3', name: 'Dairy Milk Chocolate', status: 'Low Stock (2 units left)', type: 'critical' },
  ],
  creditExposure: {
    recoveryRate: 78,
    highRisk: 12,
    activeLoans: 48,
    topDebtor: { name: 'Ramesh Jha', overdue: 12400 }
  },
  recentOperations: [
    { id: '1', title: 'Stock Restocked', desc: '50 units of Coca-Cola (250ml) added to inventory.', time: '10:24 AM', type: 'success' },
    { id: '2', title: 'Credit Payment', desc: 'Sita Devi paid NPR 500 towards her balance.', time: '09:15 AM', type: 'danger' },
    { id: '3', title: 'Report Generated', desc: 'Weekly Tax compliance report is ready for download.', time: '08:00 AM', type: 'warning' },
  ]
};

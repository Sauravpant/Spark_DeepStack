export const mockCustomers = [
  {
    id: 'CUST-9841', name: 'Anil Kapali', phone: '9841000001', email: 'anil@example.com',
    outstanding: 42500, status: 'High Risk', overdueDays: 12, score: 35,
    memberSince: 'Mar 2021', totalPurchases: 125000, recentOrderDate: '2023-10-15'
  },
  {
    id: 'CUST-1022', name: 'Priya Shrestha', phone: '9841000002', email: 'priya@example.com',
    outstanding: 5200, status: 'Low Risk', overdueDays: 0, score: 88,
    memberSince: 'Jan 2022', totalPurchases: 340000, recentOrderDate: '2023-10-24',
    probability: 98.2, suggestedLimit: 150000, dueIn: 18,
    positiveDrivers: [
      { name: 'Purchase Consistency', pts: 42 },
      { name: 'Early Payment Ratio', pts: 28 },
      { name: 'Local Community Reputation', pts: 18 },
    ],
    negativeDrivers: [
      { name: 'Category Concentration', pts: -12, desc: 'High spending on luxury items vs essentials.' },
      { name: 'Market Volatility Index', pts: -8 },
    ]
  },
  {
    id: 'CUST-2231', name: 'Manoj Bajracharya', phone: '9841000003', email: 'manoj@example.com',
    outstanding: 18900, status: 'Medium Risk', overdueDays: 2, score: 65,
    memberSince: 'Feb 2023', totalPurchases: 85000, recentOrderDate: '2023-10-20'
  },
  {
    id: 'CUST-5612', name: 'Sita Devi', phone: '9841000004', email: 'sita@example.com',
    outstanding: 0, status: 'Low Risk', overdueDays: 0, score: 95,
    memberSince: 'May 2020', totalPurchases: 560000, recentOrderDate: '2023-10-25'
  },
  {
    id: 'CUST-3342', name: 'Hari Adhikari', phone: '9841000005', email: 'hari@example.com',
    outstanding: 8500, status: 'Medium Risk', overdueDays: 5, score: 72,
    memberSince: 'Aug 2022', totalPurchases: 110000, recentOrderDate: '2023-10-18'
  },
];

export const mockCustomerStats = {
  totalCustomers: 452,
  activeCredit: 128,
  highRisk: 12,
  averageScore: 78
};

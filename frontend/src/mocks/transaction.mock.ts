export const mockTransactions = [
  { id: 'TRX-1001', date: '2023-10-25T14:30:00Z', type: 'Sale', customer: 'Sita Devi', amount: 1250, method: 'Cash', status: 'Completed' },
  { id: 'TRX-1002', date: '2023-10-25T12:15:00Z', type: 'Sale', customer: 'Priya Shrestha', amount: 3400, method: 'FonePay', status: 'Completed' },
  { id: 'TRX-1003', date: '2023-10-24T09:45:00Z', type: 'Purchase', customer: 'CG Foods', amount: 15000, method: 'Bank Transfer', status: 'Completed' },
  { id: 'TRX-1004', date: '2023-10-24T16:20:00Z', type: 'Credit Payment', customer: 'Anil Kapali', amount: 5000, method: 'Cash', status: 'Completed' },
  { id: 'TRX-1005', date: '2023-10-23T11:10:00Z', type: 'Sale', customer: 'Hari Adhikari', amount: 850, method: 'Credit', status: 'Pending' },
  { id: 'TRX-1006', date: '2023-10-23T15:55:00Z', type: 'Sale', customer: 'Walk-in Customer', amount: 420, method: 'Cash', status: 'Completed' },
];

export const mockTransactionStats = {
  todaySales: 142500,
  weeklySales: 854000,
  monthlyPurchases: 450000,
  pendingPayments: 24500
};

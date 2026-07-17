export const mockDemandData = {
  seasonality: [
    { month: 'Jan', demand: 120 }, { month: 'Feb', demand: 130 }, { month: 'Mar', demand: 150 },
    { month: 'Apr', demand: 180 }, { month: 'May', demand: 220 }, { month: 'Jun', demand: 210 },
    { month: 'Jul', demand: 190 }, { month: 'Aug', demand: 170 }, { month: 'Sep', demand: 250 },
    { month: 'Oct', demand: 320 }, { month: 'Nov', demand: 350 }, { month: 'Dec', demand: 280 },
  ],
  topGrowing: [
    { name: 'Cold Drinks', growth: 45, reason: 'Approaching Summer Season' },
    { name: 'Ice Cream', growth: 38, reason: 'Temperature Rising' },
    { name: 'Sunscreen', growth: 25, reason: 'Seasonal Shift' },
  ],
  topDeclining: [
    { name: 'Winter Wear', decline: -65, reason: 'End of Winter' },
    { name: 'Heaters', decline: -80, reason: 'End of Winter' },
    { name: 'Hot Chocolate', decline: -40, reason: 'Seasonal Shift' },
  ],
  festivalImpact: {
    festival: 'Dashain',
    daysAway: 45,
    predictedSurge: 180,
    recommendedCategories: ['Grains', 'Cooking Oil', 'Beverages', 'Snacks']
  }
};

// Nigerian Tax Calculation (PAYE) based on consolidated relief allowance and tax bands
const calculateConsolidatedRelief = (grossIncome) => {
  // Consolidated Relief Allowance (CRA) = Higher of 200,000 or 1% of Gross Income + 20% of Gross Income
  const baseRelief = Math.max(200000, grossIncome * 0.01);
  return baseRelief + (grossIncome * 0.2);
};

const TAX_BANDS = [
  { threshold: 300000, rate: 0.07 },
  { threshold: 600000, rate: 0.11 },
  { threshold: 1100000, rate: 0.15 },
  { threshold: 1600000, rate: 0.19 },
  { threshold: 3200000, rate: 0.21 },
  { threshold: Infinity, rate: 0.24 }
];

const calculateTax = (annualGrossIncome) => {
  // Calculate relief
  const relief = calculateConsolidatedRelief(annualGrossIncome);
  
  // Calculate taxable income
  const taxableIncome = Math.max(0, annualGrossIncome - relief);
  
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  let previousThreshold = 0;

  // Calculate tax for each band
  for (const band of TAX_BANDS) {
    const bandWidth = band.threshold - previousThreshold;
    const taxableInBand = Math.min(remainingIncome, bandWidth);
    
    if (taxableInBand <= 0) break;
    
    totalTax += taxableInBand * band.rate;
    remainingIncome -= taxableInBand;
    previousThreshold = band.threshold;
  }

  return {
    annualTax: totalTax,
    monthlyTax: totalTax / 12,
    taxableIncome,
    relief,
    effectiveRate: (totalTax / annualGrossIncome) * 100
  };
};

// Calculate monthly PAYE tax
const calculateMonthlyTax = (monthlyGrossIncome) => {
  const annualGross = monthlyGrossIncome * 12;
  const { monthlyTax } = calculateTax(annualGross);
  return monthlyTax;
};

module.exports = {
  calculateTax,
  calculateMonthlyTax,
  calculateConsolidatedRelief
};

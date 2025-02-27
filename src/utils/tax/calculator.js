const calculateTax = (grossSalary) => {
    if (!grossSalary || grossSalary <= 0) return { 
        monthlyTax: 0,
        annualTax: 0,
        breakdown: [],
        pensionContribution: 0,
        CRA: 0,
        taxableIncome: 0
    };

    // Convert monthly salary to annual
    const annualGrossSalary = grossSalary * 12;

    // Pension Contribution (8% of Gross Salary)
    const pensionContribution = 0.08 * annualGrossSalary;

    // Consolidated Relief Allowance (CRA) - 20% of gross salary OR ₦200,000 (whichever is higher)
    const CRA = Math.max(0.2 * annualGrossSalary, 200000);

    // Taxable Income = Gross Salary - Pension - CRA
    let taxableIncome = annualGrossSalary - (pensionContribution + CRA);

    if (taxableIncome <= 0) return {
        monthlyTax: 0,
        annualTax: 0,
        breakdown: [],
        pensionContribution,
        CRA,
        taxableIncome: 0
    };

    // Lagos State PAYE Tax Brackets (Progressive)
    const taxBrackets = [
        { threshold: 300000, rate: 0.07, name: 'First ₦300,000' },
        { threshold: 300000, rate: 0.11, name: 'Next ₦300,000' },
        { threshold: 500000, rate: 0.15, name: 'Next ₦500,000' },
        { threshold: 500000, rate: 0.19, name: 'Next ₦500,000' },
        { threshold: 1600000, rate: 0.21, name: 'Next ₦1,600,000' },
        { threshold: Infinity, rate: 0.24, name: 'Above ₦3,200,000' }
    ];

    let taxPayable = 0;
    let remainingIncome = taxableIncome;
    const breakdown = [];

    for (const bracket of taxBrackets) {
        if (remainingIncome <= 0) break;

        const taxableAtThisRate = Math.min(remainingIncome, bracket.threshold);
        const taxForBracket = taxableAtThisRate * bracket.rate;
        
        taxPayable += taxForBracket;
        remainingIncome -= taxableAtThisRate;

        breakdown.push({
            name: bracket.name,
            amount: taxableAtThisRate,
            rate: bracket.rate,
            tax: taxForBracket
        });
    }

    // Return both annual and monthly tax amounts
    return {
        monthlyTax: Math.round(taxPayable / 12),
        annualTax: Math.round(taxPayable),
        breakdown,
        pensionContribution,
        CRA,
        taxableIncome
    };
};

module.exports = calculateTax;

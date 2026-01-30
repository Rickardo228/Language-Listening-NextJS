export type Plan = {
  id: 'annual' | 'monthly';
  name: string;
  price: string;
  period: string;
  savings?: string;
  pricePerMonth?: string | null;
  popular?: boolean;
};

export const plans: Plan[] = [
  {
    id: 'annual',
    name: 'Annual',
    price: '$79.99',
    period: '/year',
    savings: 'Save 40%',
    pricePerMonth: '$6.67/month',
    popular: true,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$11.99',
    period: '/month',
    pricePerMonth: null,
    popular: false,
  },
];

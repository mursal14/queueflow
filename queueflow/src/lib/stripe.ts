import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    limits: { queues: 2, team: 2, locations: 1, displays: 1 },
  },
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER!,
    limits: { queues: 10, team: 5, locations: 3, displays: 3 },
  },
  professional: {
    name: 'Professional',
    price: 79,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL!,
    limits: { queues: 50, team: 25, locations: 10, displays: 10 },
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    limits: { queues: 9999, team: 9999, locations: 9999, displays: 9999 },
  },
}

export type Plan = keyof typeof PLANS

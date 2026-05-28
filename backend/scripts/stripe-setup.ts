/**
 * Idempotent Stripe product/price bootstrap for e-Tunisia subscription plans.
 *
 * Reads the canonical price book from src/billing/plan-catalog.ts, creates a Stripe
 * Product per paid plan and a recurring Price per (plan × cycle) in the CHARGE currency,
 * then prints the env lines to paste into backend/.env.
 *
 * Run from the backend/ directory:
 *   npx ts-node scripts/stripe-setup.ts
 *
 * Re-running is safe: products are matched by metadata and prices by lookup_key.
 */
import * as dotenv from 'dotenv';
import {
  PLAN_CATALOG,
  BillingCycle,
  amountFor,
  chargeCurrency,
  toStripeMinorUnits,
} from '../src/billing/plan-catalog';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');

const CYCLES: { cycle: BillingCycle; interval: 'month' | 'year' }[] = [
  { cycle: 'monthly', interval: 'month' },
  { cycle: 'yearly', interval: 'year' },
];

async function ensureProduct(stripe: any, planId: string, name: string) {
  const found = await stripe.products.search({
    query: `metadata['etunisia_plan']:'${planId}'`,
  });
  if (found.data.length > 0) return found.data[0];
  return stripe.products.create({
    name: `e-Tunisia ${name}`,
    metadata: { etunisia_plan: planId },
  });
}

async function ensurePrice(
  stripe: any,
  productId: string,
  planId: string,
  cycle: BillingCycle,
  interval: 'month' | 'year',
) {
  const lookupKey = `etunisia_${planId}_${cycle}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];

  const currency = chargeCurrency().toLowerCase();
  const unitAmount = toStripeMinorUnits(amountFor(planId, cycle), currency);
  return stripe.prices.create({
    product: productId,
    currency,
    unit_amount: unitAmount,
    recurring: { interval },
    lookup_key: lookupKey,
    nickname: `${planId} ${cycle}`,
  });
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_')) {
    console.error('✖ STRIPE_SECRET_KEY missing/invalid in backend/.env — add a test key first.');
    process.exit(1);
  }
  const stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });

  console.log(`Creating products/prices in ${chargeCurrency()} (display currency unaffected)…\n`);
  const envLines: string[] = [];

  for (const plan of PLAN_CATALOG) {
    if (plan.id === 'free' || !plan.stripePriceEnv) continue;
    const product = await ensureProduct(stripe, plan.id, plan.name);
    for (const { cycle, interval } of CYCLES) {
      const price = await ensurePrice(stripe, product.id, plan.id, cycle, interval);
      const envName = cycle === 'yearly' ? plan.stripePriceEnv.yearly : plan.stripePriceEnv.monthly;
      envLines.push(`${envName}=${price.id}`);
      console.log(`  ✓ ${plan.id} ${cycle}: ${price.id} (${(price.unit_amount / (chargeCurrency() === 'TND' ? 1000 : 100)).toFixed(2)} ${chargeCurrency()})`);
    }
  }

  console.log('\nPaste these into backend/.env:\n');
  console.log(envLines.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

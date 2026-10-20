import type { User } from "@prisma/client";
import Stripe from "stripe";
import { creemConfigured } from "./creem";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID,
  );
}

/** Prefer Creem (China-friendly MoR); Stripe remains optional fallback. */
export function billingConfigured(): boolean {
  return creemConfigured() || stripeConfigured();
}

export type AccessResult = {
  allowed: boolean;
  reason: string;
  planStatus: string;
  trialEndsAt: Date | null;
  /** @deprecated use billingConfigured — kept for existing clients */
  stripeConfigured: boolean;
  billingConfigured: boolean;
};

export function checkSyncAccess(user: User): AccessResult {
  const configured = billingConfigured();
  const trialEndsAt = user.trialEndsAt;
  const now = Date.now();

  if (user.isAdmin) {
    return {
      allowed: true,
      reason: "admin",
      planStatus: "active",
      trialEndsAt,
      stripeConfigured: configured,
      billingConfigured: configured,
    };
  }

  if (user.planStatus === "active") {
    return {
      allowed: true,
      reason: "active",
      planStatus: user.planStatus,
      trialEndsAt,
      stripeConfigured: configured,
      billingConfigured: configured,
    };
  }

  if (user.planStatus === "trialing") {
    if (!trialEndsAt || trialEndsAt.getTime() > now) {
      return {
        allowed: true,
        reason: "trialing",
        planStatus: user.planStatus,
        trialEndsAt,
        stripeConfigured: configured,
        billingConfigured: configured,
      };
    }
    return {
      allowed: false,
      reason: "trial_expired",
      planStatus: "none",
      trialEndsAt,
      stripeConfigured: configured,
      billingConfigured: configured,
    };
  }

  return {
    allowed: false,
    reason: user.planStatus || "none",
    planStatus: user.planStatus,
    trialEndsAt,
    stripeConfigured: configured,
    billingConfigured: configured,
  };
}

export function defaultTrialEndsAt(): Date {
  const days = Number(process.env.TRIAL_DAYS || "14");
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

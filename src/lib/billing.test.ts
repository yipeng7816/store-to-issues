import type { User } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  billingConfigured,
  checkSyncAccess,
  defaultTrialEndsAt,
} from "./billing";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    email: "dev@example.com",
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: null,
    lastLoginAt: null,
    isAdmin: false,
    planStatus: "none",
    trialEndsAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    ...overrides,
  };
}

describe("checkSyncAccess", () => {
  beforeEach(() => {
    delete process.env.CREEM_API_KEY;
    delete process.env.CREEM_PRODUCT_ID;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
  });

  afterEach(() => {
    delete process.env.CREEM_API_KEY;
    delete process.env.CREEM_PRODUCT_ID;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
    delete process.env.TRIAL_DAYS;
  });

  it("allows admin regardless of plan", () => {
    const access = checkSyncAccess(user({ isAdmin: true, planStatus: "canceled" }));
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("admin");
  });

  it("allows active subscribers", () => {
    const access = checkSyncAccess(user({ planStatus: "active" }));
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("active");
  });

  it("allows trialing users before trialEndsAt", () => {
    const access = checkSyncAccess(
      user({
        planStatus: "trialing",
        trialEndsAt: new Date(Date.now() + 86_400_000),
      }),
    );
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("trialing");
  });

  it("allows trialing with null trialEndsAt (open-ended)", () => {
    const access = checkSyncAccess(
      user({ planStatus: "trialing", trialEndsAt: null }),
    );
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("trialing");
  });

  it("denies expired trial with trial_expired reason", () => {
    const access = checkSyncAccess(
      user({
        planStatus: "trialing",
        trialEndsAt: new Date(Date.now() - 1000),
      }),
    );
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("trial_expired");
    expect(access.planStatus).toBe("none");
  });

  it("denies canceled / none / past_due", () => {
    for (const planStatus of ["canceled", "none", "past_due"]) {
      const access = checkSyncAccess(user({ planStatus }));
      expect(access.allowed).toBe(false);
      expect(access.reason).toBe(planStatus);
    }
  });
});

describe("billingConfigured / defaultTrialEndsAt", () => {
  afterEach(() => {
    delete process.env.CREEM_API_KEY;
    delete process.env.CREEM_PRODUCT_ID;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
    delete process.env.TRIAL_DAYS;
  });

  it("is true when Creem keys present", () => {
    process.env.CREEM_API_KEY = "creem_test_x";
    process.env.CREEM_PRODUCT_ID = "prod_x";
    expect(billingConfigured()).toBe(true);
  });

  it("is true when Stripe keys present", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_PRICE_ID = "price_x";
    expect(billingConfigured()).toBe(true);
  });

  it("is false when neither provider configured", () => {
    expect(billingConfigured()).toBe(false);
  });

  it("defaultTrialEndsAt uses TRIAL_DAYS", () => {
    process.env.TRIAL_DAYS = "7";
    const ends = defaultTrialEndsAt().getTime();
    const expected = Date.now() + 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(ends - expected)).toBeLessThan(2000);
  });
});

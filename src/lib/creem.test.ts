import { createHmac } from "crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  creemApiBase,
  creemConfigured,
  creemKeyLooksLikeTest,
  creemWebhookConfigured,
  pickId,
  verifyCreemSignature,
} from "./creem";

describe("creemConfigured / webhook / api base", () => {
  afterEach(() => {
    delete process.env.CREEM_API_KEY;
    delete process.env.CREEM_PRODUCT_ID;
    delete process.env.CREEM_WEBHOOK_SECRET;
    delete process.env.CREEM_TEST_MODE;
  });

  it("creemConfigured requires api key + product id", () => {
    expect(creemConfigured()).toBe(false);
    process.env.CREEM_API_KEY = "creem_test_x";
    expect(creemConfigured()).toBe(false);
    process.env.CREEM_PRODUCT_ID = "prod_x";
    expect(creemConfigured()).toBe(true);
  });

  it("creemWebhookConfigured requires api key + webhook secret", () => {
    process.env.CREEM_API_KEY = "creem_test_x";
    expect(creemWebhookConfigured()).toBe(false);
    process.env.CREEM_WEBHOOK_SECRET = "whsec";
    expect(creemWebhookConfigured()).toBe(true);
  });

  it("routes test keys to test-api.creem.io", () => {
    process.env.CREEM_API_KEY = "creem_test_abc";
    expect(creemApiBase()).toBe("https://test-api.creem.io");
    expect(creemKeyLooksLikeTest()).toBe(true);
  });

  it("routes live keys to api.creem.io", () => {
    process.env.CREEM_API_KEY = "creem_live_abc";
    expect(creemApiBase()).toBe("https://api.creem.io");
    expect(creemKeyLooksLikeTest()).toBe(false);
  });
});

describe("verifyCreemSignature", () => {
  const secret = "whsec_test";
  const body = '{"eventType":"checkout.completed"}';

  it("accepts valid HMAC hex signature", () => {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyCreemSignature(body, sig, secret)).toBe(true);
  });

  it("rejects missing / wrong / truncated signatures (alert)", () => {
    expect(verifyCreemSignature(body, null, secret)).toBe(false);
    expect(verifyCreemSignature(body, "deadbeef", secret)).toBe(false);
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyCreemSignature(body, sig.slice(0, 10), secret)).toBe(false);
    expect(verifyCreemSignature(body + "x", sig, secret)).toBe(false);
  });
});

describe("pickId", () => {
  it("reads string or object.id", () => {
    expect(pickId("cust_1")).toBe("cust_1");
    expect(pickId({ id: "cust_2" })).toBe("cust_2");
    expect(pickId(null)).toBeUndefined();
    expect(pickId({})).toBeUndefined();
  });
});

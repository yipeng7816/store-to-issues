import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();
const updateMany = vi.fn();

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => update(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
  },
}));

vi.mock("../../../../lib/billing", () => ({
  getStripe: () => null,
}));

describe("POST /api/billing/webhook (Creem)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CREEM_API_KEY = "creem_test_x";
    process.env.CREEM_WEBHOOK_SECRET = "whsec_test";
    updateMany.mockResolvedValue({ count: 1 });
    update.mockResolvedValue({});
  });

  it("rejects invalid signature with 400", async () => {
    const { POST } = await import("./route");
    const body = JSON.stringify({
      eventType: "checkout.completed",
      object: { metadata: { userId: "u1" } },
    });
    const res = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: { "creem-signature": "bad" },
        body,
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
    expect(update).not.toHaveBeenCalled();
  });

  it("activates user on checkout.completed", async () => {
    const body = JSON.stringify({
      eventType: "checkout.completed",
      object: {
        request_id: "u1",
        customer: { id: "cust_1", email: "a@b.com" },
        metadata: { userId: "u1" },
      },
    });
    const sig = createHmac("sha256", "whsec_test").update(body).digest("hex");
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: { "creem-signature": sig },
        body,
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      received: true,
      provider: "creem",
      type: "checkout.completed",
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({ planStatus: "active" }),
    });
  });

  it("revokes on subscription.canceled", async () => {
    const body = JSON.stringify({
      eventType: "subscription.canceled",
      object: {
        metadata: { userId: "u1" },
        customer: { id: "cust_1" },
      },
    });
    const sig = createHmac("sha256", "whsec_test").update(body).digest("hex");
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: { "creem-signature": sig },
        body,
      }),
    );
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({
        planStatus: "canceled",
        stripeSubscriptionId: null,
      }),
    });
  });
});

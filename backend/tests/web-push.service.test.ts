import assert from "node:assert/strict";
import { test } from "node:test";

import { env } from "../src/config/env.js";
import { WebPushService } from "../src/shared/web-push/web-push.service.js";

test("Web Push is disabled without VAPID configuration", (t) => {

  const originalEnv = { ...env };

  try {
    env.VAPID_PUBLIC_KEY = undefined;
    env.VAPID_PRIVATE_KEY = undefined;
    env.VAPID_SUBJECT = undefined;

    const service = new WebPushService();

    assert.equal(service.isEnabled(), false);
    assert.equal(service.getPublicKey(), null);
  } finally {
    Object.assign(env, originalEnv);
  }
});

test("Web Push is enabled with VAPID configuration", () => {
  const originalEnv = { ...env };

  try {
    env.VAPID_PUBLIC_KEY = "test-public-key";
    env.VAPID_PRIVATE_KEY = "test-private-key";
    env.VAPID_SUBJECT = "mailto:test@example.com";

    const service = new WebPushService();

    assert.equal(service.isEnabled(), true);
    assert.equal(service.getPublicKey(), "test-public-key");
  } finally {
    Object.assign(env, originalEnv);
  }
});

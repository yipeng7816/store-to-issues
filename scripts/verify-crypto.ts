import assert from "node:assert/strict";
import { decryptSecret, encryptSecret } from "../src/lib/crypto";

const sample = "github_pat_test_secret_value";
const enc = encryptSecret(sample);
assert.notEqual(enc, sample);
assert.match(enc, /^enc:v1:/);
assert.equal(decryptSecret(enc), sample);
assert.equal(decryptSecret("legacy-plain"), "legacy-plain");
assert.equal(encryptSecret(""), "");
console.log("crypto ok");

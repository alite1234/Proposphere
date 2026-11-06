// Unit tests for pure business logic: decimal-safe money math (spec §4.3, §8.2),
// acceptance tokens (§7.1) and proposal section defaults (§6.1, §6.3).
// Run with: npm test
const assert = require("node:assert");
const { generateToken, hashToken, documentHash } = require("./.compiled/lib/tokens.js");
const { computeTotals, money, isValidAmount } = require("./.compiled/lib/money.js");
const { emptyContent } = require("./.compiled/lib/proposal-defaults.js");

let passed = 0;
function test(label, fn) {
  try {
    fn();
    passed++;
    console.log(`ok   ${label}`);
  } catch (e) {
    console.error(`FAIL ${label}: ${e.message}`);
    process.exitCode = 1;
  }
}

// --- Spec §8.2 worked example: 100k + 20k + 30k = 150k subtotal, 10% discount -> 135k ---
test("quotation subtotal matches spec example", () =>
  assert.strictEqual(
    computeTotals(
      [
        { quantity: 1, unitPrice: 100000 },
        { quantity: 1, unitPrice: 20000 },
        { quantity: 1, unitPrice: 30000 },
      ],
      { discountType: "percent", discountValue: "10", taxRate: "0" }
    ).subtotal,
    "150000.00"
  ));

test("percentage discount matches spec example (135,000 total)", () => {
  const t = computeTotals(
    [
      { quantity: 1, unitPrice: 100000 },
      { quantity: 1, unitPrice: 20000 },
      { quantity: 1, unitPrice: 30000 },
    ],
    { discountType: "percent", discountValue: "10", taxRate: "0" }
  );
  assert.strictEqual(t.discountAmount, "15000.00");
  assert.strictEqual(t.total, "135000.00");
});

test("tax applies after discount", () => {
  const t = computeTotals([{ quantity: 2, unitPrice: 5000 }], { discountType: "none", discountValue: "0", taxRate: "7.5" });
  assert.strictEqual(t.taxableBase, "10000.00");
  assert.strictEqual(t.tax, "750.00");
  assert.strictEqual(t.total, "10750.00");
});

test("discount cannot exceed subtotal and total never goes negative", () => {
  const t = computeTotals([{ quantity: 1, unitPrice: 1000 }], { discountType: "amount", discountValue: "5000", taxRate: "0" });
  assert.strictEqual(t.discountAmount, "1000.00");
  assert.strictEqual(t.total, "0.00");
});

test("line-level discount and line tax are honoured", () => {
  const t = computeTotals([{ quantity: 1, unitPrice: 1000, lineDiscount: 100, lineTaxRate: 10 }], { discountType: "none", discountValue: "0", taxRate: "0" });
  assert.strictEqual(t.lines[0].lineTotal, "990.00");
});

test("arithmetic is decimal-safe, never floating point (spec §4.3)", () => {
  const t = computeTotals(
    [
      { quantity: 0.1, unitPrice: 1 },
      { quantity: 0.1, unitPrice: 1 },
    ],
    { discountType: "none", discountValue: "0", taxRate: "0" }
  );
  assert.strictEqual(t.total, "0.20");
});

test("negative and non-numeric amounts are rejected", () => {
  assert.strictEqual(isValidAmount("-5"), false);
  assert.strictEqual(isValidAmount("abc"), false);
  assert.strictEqual(isValidAmount("0"), true);
});

test("money formats currency symbols", () => {
  assert.strictEqual(money("135000", "NGN"), "₦135000.00");
  assert.strictEqual(money("12.5", "USD"), "$12.50");
});

// --- Spec §7.1: high-entropy, unguessable tokens; only the hash is stored ---
test("acceptance token has high entropy and is URL-safe", () => {
  const tk = generateToken();
  assert.ok(tk.raw.length >= 40);
  assert.ok(!tk.raw.includes("="));
  assert.strictEqual(tk.hash.length, 64);
});

test("token hash round-trips and never exposes the raw token", () => {
  const tk = generateToken();
  assert.strictEqual(hashToken(tk.raw), tk.hash);
});

test("document hash is deterministic and content-sensitive", () => {
  assert.strictEqual(documentHash({ a: 1 }), documentHash({ a: 1 }));
  assert.notStrictEqual(documentHash({ a: 1 }), documentHash({ a: 2 }));
});

// --- Spec §6.1/§6.3: sections adapt to complexity; comparison table on by default ---
test("package comparison table is enabled by default", () => {
  assert.strictEqual(emptyContent("simple", "NGN").comparison.enabled, true);
});

test("section set grows with project complexity", () => {
  const simple = emptyContent("simple", "NGN");
  const full = emptyContent("full", "USD");
  assert.ok(full.sections.length > simple.sections.length);
  assert.strictEqual(full.pricing.currency, "USD");
});

console.log(`\n${passed} tests passed${process.exitCode ? ", with failures" : ""}`);

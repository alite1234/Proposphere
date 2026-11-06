import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// All financial arithmetic runs here, server-side, decimal-safe. Never floats.
export function d(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(value);
}

export function money(value: Decimal | string | number, currency = "NGN"): string {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵", KES: "KSh ", ZAR: "R" };
  const sym = symbols[currency] ?? `${currency} `;
  return `${sym}${d(value).toDecimalPlaces(2).toFixed(2)}`;
}

export function num(value: Decimal | string | number): string {
  return d(value).toDecimalPlaces(2).toFixed(2);
}

export type LineInput = {
  quantity: string | number;
  unitPrice: string | number;
  lineDiscount?: string | number;
  lineTaxRate?: string | number;
};

export type QuoteTotals = {
  lines: { lineTotal: string }[];
  subtotal: string;
  discountType: "none" | "amount" | "percent";
  discountValue: string;
  discountAmount: string;
  taxableBase: string;
  taxRate: string;
  tax: string;
  total: string;
};

// Discounts apply before tax (configurable default). Server-side only.
export function computeTotals(
  lines: LineInput[],
  opts: { discountType: "none" | "amount" | "percent"; discountValue: string | number; taxRate: string | number }
): QuoteTotals {
  const computed = lines.map((l) => {
    const gross = d(l.quantity).times(d(l.unitPrice));
    const afterDiscount = gross.minus(d(l.lineDiscount ?? 0));
    const lineTotal = afterDiscount.plus(afterDiscount.times(d(l.lineTaxRate ?? 0).div(100)));
    return { lineTotal: num(lineTotal) };
  });
  const subtotal = lines.reduce((acc, l) => acc.plus(d(l.quantity).times(d(l.unitPrice))).minus(d(l.lineDiscount ?? 0)), new Decimal(0));
  const discountAmount =
    opts.discountType === "amount"
      ? d(opts.discountValue)
      : opts.discountType === "percent"
        ? subtotal.times(d(opts.discountValue).div(100))
        : new Decimal(0);
  const capped = Decimal.max(new Decimal(0), Decimal.min(discountAmount, subtotal));
  const taxableBase = subtotal.minus(capped);
  const tax = taxableBase.times(d(opts.taxRate).div(100));
  const total = taxableBase.plus(tax);
  return {
    lines: computed,
    subtotal: num(subtotal),
    discountType: opts.discountType,
    discountValue: num(d(opts.discountValue)),
    discountAmount: num(capped),
    taxableBase: num(taxableBase),
    taxRate: num(d(opts.taxRate)),
    tax: num(tax),
    total: num(total),
  };
}

export function isValidAmount(value: string | number): boolean {
  try {
    const v = d(value);
    return v.greaterThanOrEqualTo(0) && v.isFinite();
  } catch {
    return false;
  }
}

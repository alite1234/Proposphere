export function num(v: number): number {
  return v;
}

export function computeTotals(lines: Array<{ quantity: number; unitPrice: number; lineDiscount: number; lineTaxRate: number }>, options: { discountType: string; discountValue: number; taxRate: number }) {
  const { discountType, discountValue, taxRate } = options;
  let subtotal = 0;
  
  for (const l of lines) {
    subtotal += (l.quantity || 0) * (l.unitPrice || 0);
  }
  
  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = subtotal * (discountValue || 0) / 100;
  } else if (discountType === "amount") {
    discountAmount = discountValue || 0;
  }
  
  // Cap discount to subtotal
  const capped = Math.max(0, Math.min(discountAmount, subtotal));
  const taxable = subtotal - capped;
  const tax = taxable * (taxRate || 0) / 100;
  const total = subtotal - capped + tax;
  
  return {
    subtotal,
    discountAmount: capped,
    taxRate,
    tax,
    total,
  };
}
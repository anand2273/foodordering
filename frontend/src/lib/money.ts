export function formatMoney(amount: number, currency: string = "SGD"): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

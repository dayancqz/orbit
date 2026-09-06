// Live exchange rates for Split's trip-currency feature. Frankfurter
// (ECB reference rates) — free, no API key, no rate limit. Same
// dependency-free-fetch style as src/lib/googleCalendar.ts.

export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${from}&to=${to}`);
  if (!res.ok) {
    throw new Error(`Couldn't fetch the ${from}→${to} exchange rate right now — try again shortly`);
  }

  const data = (await res.json()) as { rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (typeof rate !== "number") {
    throw new Error(`No exchange rate available for ${from}→${to}`);
  }

  return rate;
}

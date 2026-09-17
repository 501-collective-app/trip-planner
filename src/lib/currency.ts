// open.er-api.com — free, no key, covers ~160 currencies including KES/UGX/RWF/UAH/RON etc.
// Rates are "units of CODE per 1 USD".

let ratesPromise: Promise<Record<string, number>> | null = null

export function fetchRates(): Promise<Record<string, number>> {
  if (!ratesPromise) {
    ratesPromise = fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('rate fetch failed'))))
      .then((data) => data.rates as Record<string, number>)
      .catch(() => ({}) as Record<string, number>)
  }
  return ratesPromise
}

// amount is in `currency`; returns the USD equivalent and the rate used (CODE per USD).
export async function toUsd(amount: number, currency: string): Promise<{ usd: number; rate: number }> {
  if (currency === 'USD') return { usd: amount, rate: 1 }
  const rates = await fetchRates()
  const rate = rates[currency]
  if (!rate) return { usd: amount, rate: 1 }
  return { usd: amount / rate, rate }
}

export function fromUsd(usdAmount: number, currency: string, rate: number): number {
  if (currency === 'USD') return usdAmount
  return usdAmount * rate
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return amount.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
  } catch {
    return `${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currency}`
  }
}

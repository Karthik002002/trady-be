import yahooFinance from "yahoo-finance2";

export default async function fetchNewPriceData(symbol) {
  try {
    // For NSE stocks, use "ONGC.NS"
    const result = await yahooFinance.quote(`${symbol}.NS`);

    return result.regularMarketPrice;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

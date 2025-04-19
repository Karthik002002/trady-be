import fetchNewPriceData from "../controller/PriceUpdate/FetchNewPrice.js";
import { Symbol } from "../model/index.js";
/**
 * Call this function whenever your watchlist updates
 */
const TWENTY_FOUR_HOURS = 60 * 60 * 1000;
export async function updatePrice(watchlist) {
  const now = new Date();

  for (const item of watchlist) {
    const { symbol } = item;

    try {
      const existing = await Symbol.findOne({ where: { symbol } });

      if (
        !existing ||
        !existing.updatedAt ||
        now - new Date(existing.updatedAt) > TWENTY_FOUR_HOURS
      ) {
        const price = await fetchNewPriceData(symbol);

        await Symbol.upsert({ symbol, price });

        console.log(`Price for ${symbol} updated to ${price}`);
      }
    } catch (err) {
      console.error(`Error updating price for ${symbol}:`, err.message);
    }
  }
}

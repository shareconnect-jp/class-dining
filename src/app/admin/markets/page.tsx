import { fetchHoldings } from "@/lib/holdings";
import { MARKET_INDICES } from "@/lib/quotes";
import { MarketsDashboard } from "./markets-dashboard";

export const metadata = {
  title: "マーケット",
};

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const holdings = await fetchHoldings();
  const indexSymbols = MARKET_INDICES.map((m) => m.symbol);

  return (
    <MarketsDashboard
      indices={MARKET_INDICES}
      indexSymbols={indexSymbols}
      holdings={holdings}
    />
  );
}

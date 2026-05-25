// Yahoo Finance の公開 chart エンドポイントから準リアルタイム価格を取得する。
// API キー不要。非公式エンドポイントのため将来の仕様変更リスクはある。
// 失敗したシンボルは error フィールド付きで返し、ページ全体は壊さない。

export type Quote = {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  marketState: string | null;
  shortName: string | null;
  error?: string;
};

// ダッシュボード上部に常に出す主要マーケット指標
export type MarketIndex = {
  symbol: string;
  label: string;
  note?: string;
};

export const MARKET_INDICES: MarketIndex[] = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ 総合" },
  { symbol: "JPY=X", label: "ドル円", note: "USD/JPY" },
  { symbol: "^N225", label: "日経平均", note: "Nikkei 225" },
  // インベスコ 世界株式 (為替ヘッジなし) — 投資信託のため基準価額は1日1回更新。
  // Yahoo がデータを返さない場合はカード上で「取得不可」と表示される。
  { symbol: "0331418A.T", label: "インベスコ 世界株式", note: "為替ヘッジなし / 基準価額" },
];

const YF_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type YahooChartMeta = {
  symbol?: string;
  currency?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  marketState?: string;
  shortName?: string;
  longName?: string;
};

async function fetchOne(symbol: string): Promise<Quote> {
  const base: Quote = {
    symbol,
    price: null,
    previousClose: null,
    change: null,
    changePercent: null,
    currency: null,
    marketState: null,
    shortName: null,
  };

  try {
    const url = `${YF_CHART_BASE}${encodeURIComponent(
      symbol,
    )}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      // クライアントの定期ポーリングで都度最新を取りに行く
      cache: "no-store",
    });

    if (!res.ok) {
      return { ...base, error: `HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      chart?: {
        result?: { meta?: YahooChartMeta }[] | null;
        error?: { description?: string } | null;
      };
    };

    if (json.chart?.error) {
      return { ...base, error: json.chart.error.description ?? "yahoo error" };
    }

    const meta = json.chart?.result?.[0]?.meta;
    if (!meta) return { ...base, error: "no data" };

    const price = meta.regularMarketPrice ?? null;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const change =
      price != null && prev != null ? price - prev : null;
    const changePercent =
      change != null && prev ? (change / prev) * 100 : null;

    return {
      symbol,
      price,
      previousClose: prev,
      change,
      changePercent,
      currency: meta.currency ?? null,
      marketState: meta.marketState ?? null,
      shortName: meta.shortName ?? meta.longName ?? null,
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  return Promise.all(unique.map(fetchOne));
}

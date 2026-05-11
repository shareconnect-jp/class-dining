export type BulkImportRow = {
  name: string;
  url: string;
};

/**
 * "店名\turl" または "店名 url" の TSV/空白区切り文字列をパースする。
 * 注釈 (※..., （...）) は除去。空行はスキップ。
 */
export function parseBulkImportInput(raw: string): BulkImportRow[] {
  const rows: BulkImportRow[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const urlMatch = trimmed.match(/https?:\/\/[^\s（）()]+/);
    if (!urlMatch) continue;
    const url = urlMatch[0].replace(/[、,。]$/, "");
    const namePart = trimmed.slice(0, urlMatch.index).trim();
    const name = namePart
      .replace(/\t+/g, " ")
      .replace(/^["']|["']$/g, "")
      .trim();
    rows.push({ name: name || "(無名)", url });
  }
  return rows;
}

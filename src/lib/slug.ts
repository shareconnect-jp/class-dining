/**
 * 店名 + エリアから URL slug を生成する (基本ヒューリスティック)。
 * クイック追加時の自動 slug 提案用。手動編集前提。
 */

const HEPBURN: Record<string, string> = {
  // ひらがな
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ゃ: "ya", ゅ: "yu", ょ: "yo", っ: "",
  ー: "-",
};

function kanaToRomaji(s: string): string {
  // カタカナ→ひらがな (簡易: カナの Unicode シフト)
  const hira = s.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );
  let out = "";
  for (const ch of hira) {
    out += HEPBURN[ch] ?? ch;
  }
  return out;
}

const AREA_ROMAJI: Record<string, string> = {
  銀座: "ginza",
  六本木: "roppongi",
  西麻布: "nishiazabu",
  麻布十番: "azabu-juban",
  恵比寿: "ebisu",
  渋谷: "shibuya",
  新宿: "shinjuku",
  代官山: "daikanyama",
  日比谷: "hibiya",
  丸の内: "marunouchi",
  品川: "shinagawa",
  目黒: "meguro",
  白金: "shirokane",
  南青山: "minamiaoyama",
  北新地: "kitashinchi",
  本町: "hommachi",
  心斎橋: "shinsaibashi",
  難波: "namba",
  中之島: "nakanoshima",
  名駅: "meieki",
  中洲: "nakasu",
  天神: "tenjin",
  祇園: "gion",
  東山: "higashiyama",
  南禅寺: "nanzenji",
  すすきの: "susukino",
  札幌: "sapporo",
  福岡: "fukuoka",
};

export function generateSlugFromName(
  name?: string,
  area?: string,
): string {
  const segments: string[] = [];
  if (area) {
    const romaji = AREA_ROMAJI[area] ?? kanaToRomaji(area);
    segments.push(romaji);
  }
  if (name) {
    segments.push(kanaToRomaji(name));
  }
  const joined = segments.join("-");
  return joined
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // 残った非対応文字をハイフンに
    .replace(/-+/g, "-") // 連続ハイフン圧縮
    .replace(/^-|-$/g, "") // 先頭末尾のハイフン削除
    .slice(0, 80);
}

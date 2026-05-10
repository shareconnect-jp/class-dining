/**
 * 取材入力からの自動生成ロジック。
 *
 * AI (Claude) が使える環境では Anthropic SDK 経由で description を生成。
 * キー未設定や失敗時は決定論的なルールベースにフォールバック。
 *
 * スコアは常にルールベースで決定 (取材者の最終調整前提)。
 */

import { genreSlugToName } from "./types";

export type GenerationInput = {
  name?: string;
  prefecture?: string;
  area?: string;
  genreSlug?: string;
  priceMin?: number;
  priceMax?: number;
  privateRoom?: boolean;
  vipAvailable?: boolean;
  businessTripFriendly?: boolean;
  customerTypes?: string[];
  editorialNote?: string;
  tabelogDescription?: string;
};

export type GeneratedScores = {
  business_dining_score: number;
  quietness_score: number;
  conversation_score: number;
  access_score: number;
  customer_types: string[];
};

export function inferScores(input: GenerationInput): GeneratedScores {
  const priceAvg =
    input.priceMin && input.priceMax
      ? (input.priceMin + input.priceMax) / 2
      : (input.priceMin ?? input.priceMax ?? 0);

  // 接待向きスコア: 予算と個室・VIPで決まる
  let business = 3;
  if (priceAvg >= 30000) business = 5;
  else if (priceAvg >= 18000) business = 4;
  else if (priceAvg >= 10000) business = 4;
  if (input.privateRoom) business = Math.min(5, business + 1);
  if (input.vipAvailable) business = Math.min(5, business + 1);
  business = Math.max(1, Math.min(5, business));

  // 静かさ: 個室があれば高、ジャンル次第
  let quietness = 3;
  if (input.privateRoom) quietness = 5;
  else if (input.genreSlug === "izakaya" || input.genreSlug === "bar") {
    quietness = 3;
  } else if (
    input.genreSlug === "washoku" ||
    input.genreSlug === "sushi" ||
    input.genreSlug === "french"
  ) {
    quietness = 4;
  }
  if (priceAvg >= 25000) quietness = Math.min(5, quietness + 1);

  // 会話: 静かさと連動 + ジャンル特性
  let conversation = 3;
  if (input.privateRoom) conversation = 5;
  else conversation = quietness >= 4 ? 4 : 3;
  if (input.genreSlug === "teppanyaki") conversation = Math.max(conversation, 4);

  // アクセス: 都心エリアなら高
  let access = 4;
  const centralPrefs = ["東京都", "大阪府", "京都府"];
  const centralAreas = [
    "銀座",
    "六本木",
    "西麻布",
    "麻布十番",
    "日比谷",
    "丸の内",
    "新宿",
    "渋谷",
    "北新地",
    "祇園",
    "東山",
  ];
  if (input.prefecture && centralPrefs.includes(input.prefecture)) access = 5;
  if (input.area && centralAreas.some((a) => input.area?.includes(a))) {
    access = 5;
  }

  // 客層: 予算とジャンルから推定
  const customer_types = input.customerTypes && input.customerTypes.length > 0
    ? input.customerTypes
    : inferCustomerTypes(priceAvg, input.genreSlug);

  return {
    business_dining_score: business,
    quietness_score: quietness,
    conversation_score: conversation,
    access_score: access,
    customer_types,
  };
}

function inferCustomerTypes(
  priceAvg: number,
  genreSlug?: string,
): string[] {
  const base = ["経営者"];
  if (priceAvg >= 25000) {
    base.push("外資系役員", "金融関係者");
  } else if (priceAvg >= 15000) {
    base.push("弁護士", "金融関係者");
  } else {
    base.push("税理士", "会計士");
  }
  if (genreSlug === "washoku" || genreSlug === "sushi") base.push("医師");
  if (genreSlug === "yakiniku") base.push("不動産関係者");
  return [...new Set(base)].slice(0, 4);
}

/**
 * 説明文をルールベースで生成 (AI フォールバック用)。
 * AI が使える時は別途 anthropic-client.ts 経由で上書き。
 */
export function generateDescriptionRuleBased(input: GenerationInput): string {
  const parts: string[] = [];
  const genreName = input.genreSlug
    ? genreSlugToName(input.genreSlug)
    : "高級店";
  const place =
    input.area && input.prefecture
      ? `${input.prefecture} ${input.area}`
      : input.area || input.prefecture || "都心";

  // 第一文: エリア + ジャンル + 雰囲気
  if (input.privateRoom && input.vipAvailable) {
    parts.push(
      `${place}の${genreName}。完全個室・VIP対応で、重要顧客の接待にも耐えうる格式と静謐性を備える一軒。`,
    );
  } else if (input.privateRoom) {
    parts.push(
      `${place}の${genreName}。個室を備え、機微な会話を要する会食シーンに適した空間。`,
    );
  } else {
    parts.push(
      `${place}の${genreName}。落ち着いた雰囲気で、ビジネス会食の選択肢に加えたい一軒。`,
    );
  }

  // 第二文: 予算
  if (input.priceMin && input.priceMax) {
    parts.push(
      `予算は ¥${input.priceMin.toLocaleString()} 〜 ¥${input.priceMax.toLocaleString()} の価格帯。`,
    );
  }

  // 第三文: 取材メモがあれば添える
  if (input.editorialNote && input.editorialNote.trim()) {
    parts.push(input.editorialNote.trim());
  } else if (input.tabelogDescription) {
    // 食べログの og:description を編集して使う (短く)
    const summary = input.tabelogDescription.slice(0, 80);
    parts.push(summary);
  }

  return parts.join(" ");
}

/**
 * AI で description 生成を試みる。失敗 / キー未設定なら null を返す。
 */
export async function generateDescriptionAI(
  input: GenerationInput,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    // dynamic import で Anthropic SDK 未インストール環境でもクラッシュしない
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const prompt = `以下の店舗情報をもとに、CLASS DINING (経営者・士業向けの接待・出張グルメメディア) のエディトリアル記事として通用する、上質で簡潔な店舗紹介文を 2〜3文 (合計 100〜180 文字程度) で書いてください。

【ブランドトーン】
- 静かなラグジュアリー、AMEX Platinum や Forbes JAPAN の語り口
- 派手な成金感ではなく、落ち着いた知的な品格
- "美味しい" など主観形容詞は最小限。空間・立地・客層・ビジネス利用適性を客観的に書く

【店舗情報】
店名: ${input.name ?? "(不明)"}
エリア: ${[input.prefecture, input.area].filter(Boolean).join(" ")}
ジャンル: ${input.genreSlug ? genreSlugToName(input.genreSlug) : "(不明)"}
予算: ${input.priceMin && input.priceMax ? `¥${input.priceMin.toLocaleString()}〜¥${input.priceMax.toLocaleString()}` : "(不明)"}
個室: ${input.privateRoom ? "あり" : "なし"}
VIP対応: ${input.vipAvailable ? "あり" : "なし"}
取材メモ: ${input.editorialNote || "(なし)"}
食べログ抜粋: ${input.tabelogDescription || "(なし)"}

本文だけを返してください (見出しや前置き、引用符は不要)。`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-7",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (block && block.type === "text") {
      return block.text.trim();
    }
    return null;
  } catch (e) {
    console.error("[generateDescriptionAI]", e);
    return null;
  }
}

export async function generateDescription(
  input: GenerationInput,
): Promise<{ text: string; source: "ai" | "rule-based" }> {
  const aiText = await generateDescriptionAI(input);
  if (aiText) return { text: aiText, source: "ai" };
  return { text: generateDescriptionRuleBased(input), source: "rule-based" };
}

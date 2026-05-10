"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GENRES, PREFECTURES, genreSlugToName } from "@/lib/types";
import { generateSlugFromName } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  autoFillAction,
  fetchTabelogInfoAction,
  saveQuickRestaurant,
} from "./actions";

const STORAGE_BUCKET = "restaurant-photos";
const TOTAL_STEPS = 4;

type UploadedMedia = {
  url: string;
  kind: "image" | "video";
  uploading?: boolean;
  error?: string;
  localId: string;
  fromTabelog?: boolean;
};

type ScrapedExtras = {
  phone?: string;
  opening_hours?: string;
  closed_days?: string;
  seats?: string;
  smoking?: string;
  cards_accepted?: string;
  parking?: string;
  access_text?: string;
  dinner_budget?: string;
  lunch_budget?: string;
  rating?: number;
  rating_count?: number;
};

export function QuickAddForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);

  // 取材入力
  const [tabelogUrl, setTabelogUrl] = useState("");
  const [editorialNote, setEditorialNote] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState("");

  // フォーム値
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [area, setArea] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [tabelogDescription, setTabelogDescription] = useState("");
  const [privateRoom, setPrivateRoom] = useState(false);
  const [vipAvailable, setVipAvailable] = useState(false);
  const [businessTripFriendly, setBusinessTripFriendly] = useState(true);
  const [businessScore, setBusinessScore] = useState(4);
  const [quietnessScore, setQuietnessScore] = useState(4);
  const [conversationScore, setConversationScore] = useState(4);
  const [accessScore, setAccessScore] = useState(4);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [googleMapUrl, setGoogleMapUrl] = useState("");

  // Tabelog から取った詳細情報 (編集可能)
  const [extras, setExtras] = useState<ScrapedExtras>({});

  // ステータス
  const [scraping, setScraping] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [aiSource, setAiSource] = useState<"ai" | "rule-based" | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExtras, setShowExtras] = useState(true);

  // ページ離脱保護
  useEffect(() => {
    const hasUnsaved = step > 1 && (name || media.length > 0);
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step, name, media.length]);

  const allUploaded = media.every((m) => !m.uploading);
  const canStep1Next = (tabelogUrl.trim() || media.length > 0) && allUploaded;

  /**
   * Tabelog 取得 → state を埋める。
   * 戻り値はスクレイプ結果そのもの (race condition 回避のため呼び出し元が直接使える)。
   */
  async function handleFetchTabelog() {
    if (!tabelogUrl.trim()) return null;
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetchTabelogInfoAction(tabelogUrl.trim());
      if (!res.ok) {
        setScrapeError(res.error ?? "取得失敗");
        return null;
      }
      // 基本情報
      if (res.name && !name) setName(res.name);
      if (res.area && !area) setArea(res.area);
      if (res.prefecture && !prefecture) setPrefecture(res.prefecture);
      if (res.genreSlug && !genre) setGenre(res.genreSlug);
      if (res.address && !address) setAddress(res.address);
      if (res.mainImage && !mainImageUrl) setMainImageUrl(res.mainImage);
      if (res.description) setTabelogDescription(res.description);
      if (res.name && !slug) {
        setSlug(generateSlugFromName(res.name, res.area));
      }
      // 予算 (数値で入る)
      if (res.priceMin && !priceMin) setPriceMin(res.priceMin);
      if (res.priceMax && !priceMax) setPriceMax(res.priceMax);
      // 個室自動判定
      if (res.privateRoom === true && !privateRoom) setPrivateRoom(true);

      // 拡張情報
      setExtras((prev) => ({
        phone: res.phone ?? prev.phone,
        opening_hours: res.openingHours ?? prev.opening_hours,
        closed_days: res.closedDays ?? prev.closed_days,
        seats: res.seats ?? prev.seats,
        smoking: res.smoking ?? prev.smoking,
        cards_accepted: res.cardsAccepted ?? prev.cards_accepted,
        parking: res.parking ?? prev.parking,
        access_text: res.accessText ?? prev.access_text,
        dinner_budget: res.dinnerBudget ?? prev.dinner_budget,
        lunch_budget: res.lunchBudget ?? prev.lunch_budget,
        rating: res.rating ?? prev.rating,
        rating_count: res.ratingCount ?? prev.rating_count,
      }));

      // ギャラリー画像 (Tabelog の写真複数を media に追加 → アップロードはせず URL 直リンク)
      if (res.galleryImages && res.galleryImages.length > 0) {
        const newGallery: UploadedMedia[] = res.galleryImages
          .filter((u) => !media.some((m) => m.url === u))
          .map((u) => ({
            url: u,
            kind: "image" as const,
            localId: `tabelog-${u}`,
            fromTabelog: true,
          }));
        if (newGallery.length > 0) {
          setMedia((prev) => [...prev, ...newGallery]);
        }
      }

      return res;
    } finally {
      setScraping(false);
    }
  }

  /** AI生成: 引数で値を受け取れるようにして、closure 経由のstale read を防ぐ */
  async function handleAutoFill(overrides?: {
    name?: string;
    prefecture?: string;
    area?: string;
    genreSlug?: string;
    tabelogDescription?: string;
  }) {
    setAutoFilling(true);
    try {
      const res = await autoFillAction({
        name: overrides?.name ?? name,
        prefecture: overrides?.prefecture ?? prefecture,
        area: overrides?.area ?? area,
        genreSlug: overrides?.genreSlug ?? genre,
        priceMin: typeof priceMin === "number" ? priceMin : undefined,
        priceMax: typeof priceMax === "number" ? priceMax : undefined,
        privateRoom,
        vipAvailable,
        businessTripFriendly,
        editorialNote,
        tabelogDescription: overrides?.tabelogDescription ?? tabelogDescription,
      });
      setDescription(res.description);
      setAiSource(res.descriptionSource);
      setBusinessScore(res.business_dining_score);
      setQuietnessScore(res.quietness_score);
      setConversationScore(res.conversation_score);
      setAccessScore(res.access_score);
      setCustomerTypes(res.customer_types);
      if (res.suggestedSlug && !slug) setSlug(res.suggestedSlug);
    } finally {
      setAutoFilling(false);
    }
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    asMain: boolean = false,
  ) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const supabase = createSupabaseBrowserClient();
    const newItems: UploadedMedia[] = Array.from(files).map((f) => ({
      url: "",
      kind: f.type.startsWith("video/") ? "video" : "image",
      uploading: true,
      localId: `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`,
    }));
    setMedia((prev) => [...prev, ...newItems]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const localId = newItems[i].localId;
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `restaurants/${slug || "draft"}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
      if (upErr) {
        setMedia((prev) =>
          prev.map((m) =>
            m.localId === localId
              ? { ...m, uploading: false, error: upErr.message }
              : m,
          ),
        );
        continue;
      }
      const { data: pub } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);
      setMedia((prev) =>
        prev.map((m) =>
          m.localId === localId
            ? { ...m, uploading: false, url: pub.publicUrl }
            : m,
        ),
      );
      if (asMain && i === 0 && newItems[i].kind === "image" && !mainImageUrl) {
        setMainImageUrl(pub.publicUrl);
      }
    }
    e.target.value = "";
  }

  function removeMedia(localId: string) {
    const target = media.find((m) => m.localId === localId);
    setMedia((prev) => prev.filter((m) => m.localId !== localId));
    if (target?.url === mainImageUrl) {
      const nextMain = media.find(
        (m) => m.localId !== localId && m.kind === "image" && m.url,
      );
      setMainImageUrl(nextMain?.url ?? "");
    }
  }

  function handleSubmit() {
    setError(null);
    const galleryImages = media
      .filter((m) => m.kind === "image" && m.url && m.url !== mainImageUrl)
      .map((m) => m.url);
    const galleryVideos = media
      .filter((m) => m.kind === "video" && m.url)
      .map((m) => m.url);

    startTransition(async () => {
      const res = await saveQuickRestaurant({
        name,
        slug,
        prefecture,
        area,
        genre,
        description,
        address,
        price_min: typeof priceMin === "number" ? priceMin : null,
        price_max: typeof priceMax === "number" ? priceMax : null,
        tabelog_url: tabelogUrl,
        official_url: officialUrl,
        google_map_url: googleMapUrl,
        instagram_url: instagramUrl,
        main_image_url: mainImageUrl,
        gallery_image_urls: galleryImages,
        gallery_video_urls: galleryVideos,
        private_room: privateRoom,
        vip_available: vipAvailable,
        business_trip_friendly: businessTripFriendly,
        business_dining_score: businessScore,
        quietness_score: quietnessScore,
        conversation_score: conversationScore,
        access_score: accessScore,
        customer_types: customerTypes,
        editorial_note: editorialNote,
        is_published: isPublished,
        // 拡張
        phone: extras.phone,
        opening_hours: extras.opening_hours,
        closed_days: extras.closed_days,
        seats: extras.seats,
        smoking: extras.smoking,
        cards_accepted: extras.cards_accepted,
        parking: extras.parking,
        access_text: extras.access_text,
        dinner_budget: extras.dinner_budget,
        lunch_budget: extras.lunch_budget,
        rating: extras.rating ?? null,
        rating_count: extras.rating_count ?? null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/admin/restaurants/${res.id}/edit?just_created=1`);
    });
  }

  const canSave = !pending && allUploaded && name && slug && prefecture && genre;

  // step 2 自動 AI 生成 (step 1→2 の遷移時に scraper も走らせ、結果を直接 AI に渡す)
  async function advanceFromStep1() {
    let scraped: Awaited<ReturnType<typeof handleFetchTabelog>> = null;
    if (tabelogUrl.trim() && !name) {
      scraped = await handleFetchTabelog();
    }
    setStep(2);
    if (!description) {
      // race condition fix: closure 経由ではなく scraped から直接渡す
      await handleAutoFill({
        name: scraped?.name ?? undefined,
        prefecture: scraped?.prefecture ?? undefined,
        area: scraped?.area ?? undefined,
        genreSlug: scraped?.genreSlug ?? undefined,
        tabelogDescription: scraped?.description ?? undefined,
      });
    }
  }

  return (
    <>
      {/* 進捗バー */}
      <div className="qa-progress">
        <div
          className="qa-progress-fill"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* ステップ表示 (右上) */}
      <div className="fixed top-3 right-5 z-40 text-[10px] tracking-[0.4em] text-[color:var(--color-text-faded)]">
        {step} / {TOTAL_STEPS}
      </div>

      <div className="relative min-h-[calc(100vh-4rem)] pb-32">
        <div className="qa-hero-glow" />

        {/* ----------- STEP 1: capture ----------- */}
        {step === 1 && (
          <div className="qa-fade-up relative z-10 px-5 pt-8 max-w-md mx-auto">
            <p className="text-[10px] tracking-[0.5em] text-[color:var(--color-gold)] mb-3 font-bold">
              STEP 01 — CAPTURE
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl leading-snug mb-8">
              URL を貼って、
              <br />
              取材を始める。
            </h2>

            {/* 食べログURL (一番上に昇格) */}
            <div className="qa-fade-up mb-8">
              <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-gold)] mb-2 uppercase font-bold">
                ★ Tabelog URL
              </label>
              <input
                type="url"
                inputMode="url"
                value={tabelogUrl}
                onChange={(e) => setTabelogUrl(e.target.value)}
                placeholder="https://tabelog.com/..."
                className="qa-input qa-input-sans"
              />
              <p className="text-[10px] text-[color:var(--color-text-faded)] mt-2 leading-relaxed">
                URL貼って「次へ」を押すと、店名/エリア/ジャンル/住所/電話/営業時間/予算/席数/個室/写真ギャラリー
                を一気に取得 → AIが紹介文も書きます。
              </p>
              {scrapeError && (
                <p className="text-xs text-red-400 mt-2">{scrapeError}</p>
              )}
            </div>

            {/* 写真 / 動画 */}
            <p className="text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-3 uppercase">
              + 自分の写真・動画 (任意)
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <label className="qa-capture-btn">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e, true)}
                />
                <span className="text-3xl">📷</span>
                <span className="text-xs tracking-[0.3em] text-[color:var(--color-gold)]">
                  PHOTO
                </span>
              </label>
              <label className="qa-capture-btn">
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e)}
                />
                <span className="text-3xl">🎬</span>
                <span className="text-xs tracking-[0.3em] text-[color:var(--color-gold)]">
                  VIDEO
                </span>
              </label>
            </div>

            {media.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-6 qa-fade-up">
                {media.map((m) => (
                  <div
                    key={m.localId}
                    className="relative aspect-square bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-soft)] overflow-hidden rounded-xl group"
                  >
                    {m.uploading ? (
                      <div className="qa-shimmer absolute inset-0" />
                    ) : m.error ? (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-red-400 p-1 text-center">
                        {m.error.slice(0, 30)}
                      </div>
                    ) : m.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={m.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    {m.url && m.url === mainImageUrl && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] bg-[color:var(--color-gold)] text-[color:var(--color-bg)] px-1.5 py-0.5 font-black tracking-widest rounded">
                        MAIN
                      </span>
                    )}
                    {m.fromTabelog && (
                      <span className="absolute bottom-1.5 right-1.5 text-[8px] bg-black/70 text-[color:var(--color-text-muted)] px-1.5 py-0.5 tracking-widest rounded">
                        TBLG
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(m.localId)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 text-white text-xs flex items-center justify-center rounded-full"
                      aria-label="削除"
                    >
                      ×
                    </button>
                    {m.kind === "image" && m.url && m.url !== mainImageUrl && (
                      <button
                        type="button"
                        onClick={() => setMainImageUrl(m.url)}
                        className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] bg-black/70 text-white py-1 rounded tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        MAINに
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 取材メモ */}
            <div className="qa-fade-up mb-6">
              <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-2 uppercase">
                Field Notes (optional)
              </label>
              <textarea
                value={editorialNote}
                onChange={(e) => setEditorialNote(e.target.value)}
                rows={3}
                placeholder="取材時の所感を書くと、AIがブランドトーンに沿った紹介文に反映 (例: カウンター8席、英語対応、季節の意匠が美しい)"
                className="qa-textarea"
              />
            </div>
          </div>
        )}

        {/* ----------- STEP 2: review ----------- */}
        {step === 2 && (
          <div className="qa-fade-up relative z-10 px-5 pt-8 max-w-md mx-auto">
            <p className="text-[10px] tracking-[0.5em] text-[color:var(--color-gold)] mb-3 font-bold">
              STEP 02 — DRAFT
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl leading-snug mb-8">
              {autoFilling ? "編集部が筆を入れています…" : "編集部の下書きを確認"}
            </h2>

            {/* メイン画像 */}
            {mainImageUrl && (
              <div className="aspect-[4/3] mb-6 overflow-hidden rounded-2xl border border-[color:var(--color-border-soft)] qa-fade-up">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 店名 */}
            <div className="mb-6 qa-fade-up">
              <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                Restaurant
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="店名"
                className="qa-input"
              />
            </div>

            {/* エリア + ジャンル */}
            <div className="grid grid-cols-2 gap-4 mb-6 qa-fade-up">
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                  Pref
                </label>
                <select
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="qa-input qa-input-sans"
                >
                  <option value="">—</option>
                  {PREFECTURES.map((p) => (
                    <option key={p.slug} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="qa-input qa-input-sans"
                >
                  <option value="">—</option>
                  {GENRES.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6 qa-fade-up">
              <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                Area
              </label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="例: 銀座"
                className="qa-input qa-input-sans"
              />
            </div>

            {/* 予算 */}
            <div className="mb-7 qa-fade-up">
              <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-2 uppercase">
                Price Range (¥)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  value={priceMin}
                  onChange={(e) =>
                    setPriceMin(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="20,000"
                  className="qa-input qa-input-sans flex-1"
                />
                <span className="text-[color:var(--color-text-faded)]">—</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={priceMax}
                  onChange={(e) =>
                    setPriceMax(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="40,000"
                  className="qa-input qa-input-sans flex-1"
                />
              </div>
              {(extras.dinner_budget || extras.lunch_budget) && (
                <p className="text-[10px] text-[color:var(--color-text-faded)] mt-2">
                  Tabelog: 夜 {extras.dinner_budget ?? "—"} / 昼 {extras.lunch_budget ?? "—"}
                </p>
              )}
            </div>

            {/* AI生成された説明 */}
            <div className="mb-6 qa-fade-up">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] uppercase">
                  Editorial Copy
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoFill()}
                  disabled={autoFilling}
                  className="text-[10px] tracking-[0.3em] text-[color:var(--color-gold)] hover:underline disabled:opacity-50"
                >
                  {autoFilling ? "GENERATING…" : "✨ REGENERATE"}
                </button>
              </div>
              {autoFilling ? (
                <div className="space-y-2">
                  <div className="qa-shimmer h-4 rounded" />
                  <div className="qa-shimmer h-4 rounded w-11/12" />
                  <div className="qa-shimmer h-4 rounded w-9/12" />
                </div>
              ) : (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="ここに紹介文が生成されます。手で書いてもOK。"
                  className="qa-textarea"
                />
              )}
              {aiSource && !autoFilling && (
                <p className="text-[9px] tracking-widest text-[color:var(--color-text-faded)] mt-2 uppercase">
                  via {aiSource === "ai" ? "Claude AI ✨" : "Editorial Engine"}
                </p>
              )}
            </div>

            {/* Tabelog から取った詳細情報 */}
            {(extras.phone || extras.opening_hours || extras.seats || extras.access_text || extras.rating) && (
              <div className="mb-6 qa-fade-up border border-[color:var(--color-gold)]/20 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setShowExtras(!showExtras)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between"
                >
                  <span className="text-[10px] tracking-[0.4em] text-[color:var(--color-gold)] uppercase">
                    {showExtras ? "▼" : "▶"} Tabelog から取得した詳細
                  </span>
                  {extras.rating && (
                    <span className="text-xs text-[color:var(--color-gold)]">
                      ★ {extras.rating} ({extras.rating_count ?? "?"}件)
                    </span>
                  )}
                </button>
                {showExtras && (
                  <div className="px-5 pb-5 space-y-3 qa-fade-up">
                    <ExtrasField
                      label="電話"
                      value={extras.phone}
                      onChange={(v) => setExtras({ ...extras, phone: v })}
                    />
                    <ExtrasField
                      label="営業時間"
                      value={extras.opening_hours}
                      multiline
                      onChange={(v) => setExtras({ ...extras, opening_hours: v })}
                    />
                    <ExtrasField
                      label="定休日"
                      value={extras.closed_days}
                      onChange={(v) => setExtras({ ...extras, closed_days: v })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <ExtrasField
                        label="席数"
                        value={extras.seats}
                        onChange={(v) => setExtras({ ...extras, seats: v })}
                      />
                      <ExtrasField
                        label="駐車場"
                        value={extras.parking}
                        onChange={(v) => setExtras({ ...extras, parking: v })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ExtrasField
                        label="クレカ"
                        value={extras.cards_accepted}
                        onChange={(v) => setExtras({ ...extras, cards_accepted: v })}
                      />
                      <ExtrasField
                        label="喫煙"
                        value={extras.smoking}
                        onChange={(v) => setExtras({ ...extras, smoking: v })}
                      />
                    </div>
                    <ExtrasField
                      label="アクセス"
                      value={extras.access_text}
                      multiline
                      onChange={(v) => setExtras({ ...extras, access_text: v })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ----------- STEP 3: feel ----------- */}
        {step === 3 && (
          <div className="qa-fade-up relative z-10 px-5 pt-8 max-w-md mx-auto">
            <p className="text-[10px] tracking-[0.5em] text-[color:var(--color-gold)] mb-3 font-bold">
              STEP 03 — FEEL
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl leading-snug mb-8">
              店の空気を、
              <br />
              評価軸に落とす。
            </h2>

            <div className="space-y-7 mb-8">
              <DotScore label="接待" value={businessScore} onChange={setBusinessScore} />
              <DotScore label="静かさ" value={quietnessScore} onChange={setQuietnessScore} />
              <DotScore label="会話" value={conversationScore} onChange={setConversationScore} />
              <DotScore label="アクセス" value={accessScore} onChange={setAccessScore} />
            </div>

            <div className="mb-7">
              <p className="text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-3 uppercase">
                Features
              </p>
              <div className="flex flex-wrap gap-2">
                <Pill active={privateRoom} onClick={() => setPrivateRoom(!privateRoom)}>
                  個室
                </Pill>
                <Pill active={vipAvailable} onClick={() => setVipAvailable(!vipAvailable)}>
                  VIP対応
                </Pill>
                <Pill
                  active={businessTripFriendly}
                  onClick={() => setBusinessTripFriendly(!businessTripFriendly)}
                >
                  出張向き
                </Pill>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-3 uppercase">
                Customer Types
              </p>
              <CustomerTypeChips
                values={customerTypes}
                onChange={setCustomerTypes}
              />
            </div>

            {/* 詳細編集 (折りたたみ) */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="block w-full text-left text-[10px] tracking-[0.3em] text-[color:var(--color-text-faded)] hover:text-[color:var(--color-gold)] py-3 border-t border-b border-[color:var(--color-border-soft)] mb-4"
            >
              {showAdvanced ? "▼" : "▶"} ADVANCED — 住所 / slug / 公式 / Insta
            </button>
            {showAdvanced && (
              <div className="space-y-4 mb-6 qa-fade-up">
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                    Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      pattern="[a-z0-9\-]+"
                      placeholder="ginza-sushi-aoki"
                      className="qa-input qa-input-sans flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setSlug(generateSlugFromName(name, area))}
                      className="qa-cta-ghost text-[10px] tracking-[0.2em]"
                    >
                      RE-GEN
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                    Address
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="qa-input qa-input-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                    Official Site URL
                  </label>
                  <input
                    type="url"
                    value={officialUrl}
                    onChange={(e) => setOfficialUrl(e.target.value)}
                    placeholder="https://..."
                    className="qa-input qa-input-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://www.instagram.com/..."
                    className="qa-input qa-input-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[color:var(--color-text-muted)] mb-1 uppercase">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={googleMapUrl}
                    onChange={(e) => setGoogleMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="qa-input qa-input-sans"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------- STEP 4: publish ----------- */}
        {step === 4 && (
          <div className="qa-fade-up relative z-10 px-5 pt-8 max-w-md mx-auto">
            <p className="text-[10px] tracking-[0.5em] text-[color:var(--color-gold)] mb-3 font-bold">
              STEP 04 — PUBLISH
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl leading-snug mb-8">
              最終確認、
              <br />
              そして公開へ。
            </h2>

            {/* 店舗カードプレビュー */}
            <div className="luxury-card overflow-hidden mb-7 qa-fade-up">
              {mainImageUrl && (
                <div className="aspect-[16/9] overflow-hidden bg-[color:var(--color-bg-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-[color:var(--color-gold)] mb-2">
                  <span>{prefecture || "—"}</span>
                  {area && (
                    <>
                      <span className="opacity-40">/</span>
                      <span>{area}</span>
                    </>
                  )}
                  {genre && (
                    <>
                      <span className="opacity-40">/</span>
                      <span>{genreSlugToName(genre)}</span>
                    </>
                  )}
                </div>
                <h3 className="font-serif text-xl mb-3">{name || "—"}</h3>
                <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed line-clamp-3 mb-4">
                  {description || "(紹介文未生成)"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-[color:var(--color-text-faded)]">
                  <span>接待 {"●".repeat(businessScore)}</span>
                  <span>静かさ {"●".repeat(quietnessScore)}</span>
                  <span>会話 {"●".repeat(conversationScore)}</span>
                  <span>アクセス {"●".repeat(accessScore)}</span>
                </div>
              </div>
            </div>

            {/* 取得したリッチ情報のサマリ */}
            {(extras.phone || extras.opening_hours || extras.seats) && (
              <div className="mb-6 qa-fade-up text-[11px] text-[color:var(--color-text-muted)] space-y-1.5 border border-[color:var(--color-border-soft)] rounded-xl p-4">
                {extras.phone && <div>📞 {extras.phone}</div>}
                {extras.opening_hours && (
                  <div>🕐 {extras.opening_hours.replace(/\n/g, " / ")}</div>
                )}
                {extras.seats && <div>🪑 {extras.seats}</div>}
                {extras.access_text && (
                  <div>🚉 {extras.access_text.split("\n")[0]}</div>
                )}
                {media.filter((m) => m.kind === "image").length > 0 && (
                  <div>
                    📷 {media.filter((m) => m.kind === "image").length} 枚
                  </div>
                )}
              </div>
            )}

            {/* 公開トグル */}
            <div className="flex items-center justify-between p-5 border border-[color:var(--color-border-soft)] rounded-2xl mb-6">
              <div>
                <p className="text-sm font-bold mb-1">
                  {isPublished ? "今すぐ公開" : "下書き保存"}
                </p>
                <p className="text-[10px] text-[color:var(--color-text-faded)]">
                  {isPublished
                    ? "サイトに即時掲載されます"
                    : "後で公開できます"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublished}
                onClick={() => setIsPublished(!isPublished)}
                className={`relative w-14 h-8 rounded-full transition-colors ${isPublished ? "bg-[color:var(--color-gold)]" : "bg-[color:var(--color-border)]"}`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isPublished ? "left-7" : "left-1"}`}
                />
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400 leading-relaxed mb-4">
                {error}
              </p>
            )}
          </div>
        )}

        {/* ----------- BOTTOM CTA BAR ----------- */}
        <div className="qa-bottom-bar">
          <div className="max-w-md mx-auto flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="qa-cta-ghost"
                disabled={pending}
              >
                ← 戻る
              </button>
            )}
            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={async () => {
                  if (step === 1) await advanceFromStep1();
                  else setStep(step + 1);
                }}
                disabled={
                  (step === 1 && !canStep1Next) ||
                  scraping ||
                  (step === 2 && !name)
                }
                className="qa-cta-primary flex-1"
              >
                {scraping
                  ? "解析中…"
                  : step === 1
                    ? "次へ"
                    : step === 2
                      ? "次へ"
                      : "確認へ"}
              </button>
            )}
            {step === TOTAL_STEPS && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSave}
                className="qa-cta-primary flex-1"
              >
                {pending
                  ? "保存中…"
                  : !allUploaded
                    ? "アップロード待機"
                    : isPublished
                      ? "公開する"
                      : "下書き保存"}
              </button>
            )}
          </div>
          {step === 1 && (
            <p className="max-w-md mx-auto text-center text-[10px] tracking-widest text-[color:var(--color-text-faded)] mt-2">
              Tabelog URL を貼って「次へ」 → 全自動取得 + AI記事
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ============== コンポーネント ============== */

function ExtrasField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  if (!value && value !== "") return null;
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] text-[color:var(--color-text-faded)] mb-1 uppercase">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full bg-transparent border border-[color:var(--color-border-soft)] focus:border-[color:var(--color-gold)] outline-none text-xs px-3 py-2 rounded-lg"
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border border-[color:var(--color-border-soft)] focus:border-[color:var(--color-gold)] outline-none text-xs px-3 py-2 rounded-lg"
        />
      )}
    </div>
  );
}

function DotScore({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm tracking-widest">{label}</span>
        <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-gold)]">
          {value} / 5
        </span>
      </div>
      <div className="flex gap-2.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`qa-dot ${n <= value ? "active" : ""}`}
            aria-label={`${label} ${n}`}
          />
        ))}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="qa-pill"
    >
      {children}
    </button>
  );
}

const TYPE_OPTIONS = [
  "経営者",
  "弁護士",
  "税理士",
  "会計士",
  "医師",
  "金融関係者",
  "不動産関係者",
  "外資系役員",
];

function CustomerTypeChips({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const set = useMemo(() => new Set(values), [values]);
  function toggle(v: string) {
    onChange(set.has(v) ? values.filter((x) => x !== v) : [...values, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {TYPE_OPTIONS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => toggle(t)}
          aria-pressed={set.has(t)}
          className="qa-pill"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// 未使用回避用 (Link import の lint 抑制)
void Link;

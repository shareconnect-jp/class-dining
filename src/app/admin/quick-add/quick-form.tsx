"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GENRES, PREFECTURES } from "@/lib/types";
import { generateSlugFromName } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  autoFillAction,
  fetchTabelogInfoAction,
  saveQuickRestaurant,
} from "./actions";

const STORAGE_BUCKET = "restaurant-photos";

type UploadedMedia = {
  url: string;
  kind: "image" | "video";
  uploading?: boolean;
  error?: string;
  localId: string;
};

export function QuickAddForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 取得・生成のステータス
  const [scraping, setScraping] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [aiSource, setAiSource] = useState<"ai" | "rule-based" | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // フォーム状態
  const [tabelogUrl, setTabelogUrl] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [area, setArea] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [editorialNote, setEditorialNote] = useState("");
  const [tabelogDescription, setTabelogDescription] = useState("");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [vipAvailable, setVipAvailable] = useState(false);
  const [businessTripFriendly, setBusinessTripFriendly] = useState(true);
  const [businessScore, setBusinessScore] = useState(4);
  const [quietnessScore, setQuietnessScore] = useState(4);
  const [conversationScore, setConversationScore] = useState(4);
  const [accessScore, setAccessScore] = useState(4);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetchTabelog() {
    if (!tabelogUrl.trim()) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetchTabelogInfoAction(tabelogUrl.trim());
      if (!res.ok) {
        setScrapeError(res.error ?? "取得失敗");
        return;
      }
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
    } finally {
      setScraping(false);
    }
  }

  async function handleAutoFill() {
    setAutoFilling(true);
    try {
      const res = await autoFillAction({
        name,
        prefecture,
        area,
        genreSlug: genre,
        priceMin: typeof priceMin === "number" ? priceMin : undefined,
        priceMax: typeof priceMax === "number" ? priceMax : undefined,
        privateRoom,
        vipAvailable,
        businessTripFriendly,
        editorialNote,
        tabelogDescription,
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
      if (asMain && i === 0 && newItems[i].kind === "image") {
        setMainImageUrl(pub.publicUrl);
      }
    }
    e.target.value = "";
  }

  function removeMedia(localId: string) {
    setMedia((prev) => prev.filter((m) => m.localId !== localId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/admin/restaurants/${res.id}/edit?just_created=1`);
    });
  }

  const allUploaded = media.every((m) => !m.uploading);
  const canSubmit =
    !pending && allUploaded && name && slug && prefecture && genre;

  return (
    <form onSubmit={handleSubmit} className="space-y-7 max-w-2xl">
      {/* STEP 1: 食べログ取得 */}
      <Section step="1" title="食べログ URL を貼って情報取得">
        <div className="flex gap-2">
          <input
            type="url"
            inputMode="url"
            value={tabelogUrl}
            onChange={(e) => setTabelogUrl(e.target.value)}
            placeholder="https://tabelog.com/tokyo/..."
            className={baseInput}
          />
          <button
            type="button"
            onClick={handleFetchTabelog}
            disabled={!tabelogUrl.trim() || scraping}
            className={`${primaryBtn} whitespace-nowrap min-w-[88px]`}
          >
            {scraping ? "..." : "取得"}
          </button>
        </div>
        {scrapeError && (
          <p className="text-xs text-red-400 mt-2">{scrapeError}</p>
        )}
        {tabelogDescription && (
          <p className="text-xs text-[color:var(--color-text-faded)] mt-2 line-clamp-3">
            食べログ抜粋: {tabelogDescription}
          </p>
        )}
      </Section>

      {/* STEP 2: 写真・動画 */}
      <Section step="2" title="写真・動画をアップロード">
        <p className="text-xs text-[color:var(--color-text-muted)] mb-3">
          1枚目の画像が自動的にメイン画像になります(後で変更可)。動画は短尺推奨 (50MB以下/本)。
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className={fileBtn}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e, true)}
            />
            📷 写真撮影/選択
          </label>
          <label className={fileBtn}>
            <input
              type="file"
              accept="video/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e)}
            />
            🎬 動画
          </label>
        </div>

        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((m) => (
              <div
                key={m.localId}
                className="relative aspect-square bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-soft)] overflow-hidden"
              >
                {m.uploading ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[color:var(--color-text-faded)]">
                    アップロード中…
                  </div>
                ) : m.error ? (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-red-400 p-1 text-center">
                    {m.error.slice(0, 40)}
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
                {m.url === mainImageUrl && (
                  <span className="absolute top-1 left-1 text-[10px] bg-[color:var(--color-gold)] text-[color:var(--color-bg)] px-1.5 py-0.5 font-bold">
                    MAIN
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(m.localId)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white text-xs flex items-center justify-center"
                  aria-label="削除"
                >
                  ×
                </button>
                {m.kind === "image" && m.url && m.url !== mainImageUrl && (
                  <button
                    type="button"
                    onClick={() => setMainImageUrl(m.url)}
                    className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/60 text-white py-1"
                  >
                    メインに
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* STEP 3: 取材メモ + AI 補完 */}
      <Section step="3" title="取材メモ + AI で記事生成">
        <textarea
          value={editorialNote}
          onChange={(e) => setEditorialNote(e.target.value)}
          rows={4}
          placeholder="取材時の所感を短くメモ (例: 個室の天井高が高く、海外ゲストにも見栄えがする / マスターが英語対応可)"
          className={baseInput}
        />
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={autoFilling}
          className={`${secondaryBtn} mt-3 w-full`}
        >
          {autoFilling
            ? "生成中…"
            : "✨ AI で説明文 + スコア + 客層を自動生成"}
        </button>
        {aiSource && (
          <p className="text-[10px] text-[color:var(--color-text-faded)] mt-2">
            生成エンジン:{" "}
            {aiSource === "ai" ? "Claude (AI)" : "ルールベース (AIキー未設定)"}
          </p>
        )}
      </Section>

      {/* STEP 4: 必須情報 */}
      <Section step="4" title="必須情報の確認">
        <Field label="店名 *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={baseInput}
          />
        </Field>
        <Field label="slug * (URL)">
          <div className="flex gap-2">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9\-]+"
              placeholder="ginza-sushi-aoki"
              className={baseInput}
            />
            <button
              type="button"
              onClick={() => setSlug(generateSlugFromName(name, area))}
              className={`${linkBtn} whitespace-nowrap`}
            >
              再生成
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="都道府県 *">
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              required
              className={baseInput}
            >
              <option value="">選択</option>
              {PREFECTURES.map((p) => (
                <option key={p.slug} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ジャンル *">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className={baseInput}
            >
              <option value="">選択</option>
              {GENRES.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="エリア (例: 銀座)">
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className={baseInput}
          />
        </Field>
        <Field label="住所">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={baseInput}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="予算 下限 (円)">
            <input
              type="number"
              inputMode="numeric"
              value={priceMin}
              onChange={(e) =>
                setPriceMin(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={baseInput}
            />
          </Field>
          <Field label="予算 上限 (円)">
            <input
              type="number"
              inputMode="numeric"
              value={priceMax}
              onChange={(e) =>
                setPriceMax(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={baseInput}
            />
          </Field>
        </div>
      </Section>

      {/* STEP 5: 生成された内容のレビュー */}
      <Section step="5" title="生成された内容を確認・編集">
        <Field label="紹介文">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={baseInput}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <Check
            checked={privateRoom}
            onChange={setPrivateRoom}
            label="個室"
          />
          <Check
            checked={vipAvailable}
            onChange={setVipAvailable}
            label="VIP対応"
          />
          <Check
            checked={businessTripFriendly}
            onChange={setBusinessTripFriendly}
            label="出張向き"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <ScoreSlider
            label="接待"
            value={businessScore}
            onChange={setBusinessScore}
          />
          <ScoreSlider
            label="静かさ"
            value={quietnessScore}
            onChange={setQuietnessScore}
          />
          <ScoreSlider
            label="会話"
            value={conversationScore}
            onChange={setConversationScore}
          />
          <ScoreSlider
            label="アクセス"
            value={accessScore}
            onChange={setAccessScore}
          />
        </div>

        <Field label="客層 (カンマ区切り)">
          <input
            value={customerTypes.join(", ")}
            onChange={(e) =>
              setCustomerTypes(
                e.target.value
                  .split(/[,、]/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            className={baseInput}
          />
        </Field>
      </Section>

      {/* STEP 6: 公開 */}
      <Section step="6" title="保存">
        <Check
          checked={isPublished}
          onChange={setIsPublished}
          label="今すぐ公開する (オフなら下書きとして保存)"
        />
        {error && (
          <p className="text-sm text-red-400 mt-3 leading-relaxed">{error}</p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`${primaryBtn} w-full mt-4 py-4 text-base`}
        >
          {pending ? "保存中…" : !allUploaded ? "アップロード待機中" : "保存して詳細編集へ"}
        </button>
      </Section>
    </form>
  );
}

const baseInput =
  "w-full px-3 py-3 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] focus:border-[color:var(--color-gold)] outline-none text-base";

const primaryBtn =
  "px-5 py-3 bg-[color:var(--color-gold)] text-[color:var(--color-bg)] hover:bg-[color:var(--color-gold-soft)] transition-colors font-bold text-sm tracking-wider disabled:opacity-50";

const secondaryBtn =
  "px-5 py-3 border border-[color:var(--color-gold)] text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-bg)] transition-colors font-bold text-sm tracking-wider disabled:opacity-50";

const linkBtn =
  "px-3 py-2 text-xs tracking-wider text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gold)] border border-[color:var(--color-border-soft)]";

const fileBtn =
  "flex items-center justify-center gap-2 py-5 border-2 border-dashed border-[color:var(--color-border)] hover:border-[color:var(--color-gold)] cursor-pointer text-sm";

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="luxury-card p-5">
      <h2 className="flex items-center gap-3 mb-4">
        <span className="font-serif text-lg text-[color:var(--color-gold)]">
          {step}
        </span>
        <span className="text-sm tracking-wider text-[color:var(--color-text)]">
          {title}
        </span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs tracking-wider text-[color:var(--color-text-muted)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-[color:var(--color-gold)]"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[color:var(--color-text-muted)]">
          {label}
        </span>
        <span className="text-xs text-[color:var(--color-gold)] font-bold">
          {value}/5
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--color-gold)]"
      />
    </label>
  );
}

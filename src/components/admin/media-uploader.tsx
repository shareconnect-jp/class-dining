"use client";

import { useState, useEffect, useId } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type UploadedMedia = {
  url: string;
  kind: "image" | "video";
  uploading?: boolean;
  error?: string;
  localId: string;
  fromExternal?: boolean; // Tabelog 等から自動取り込み
};

type MediaState = {
  main: string;
  galleryImages: string[];
  galleryVideos: string[];
  allUploaded: boolean;
};

type Props = {
  initialMain?: string | null;
  initialGalleryImages?: string[];
  initialGalleryVideos?: string[];
  storageBucket?: string;
  storagePathPrefix: string;
  onChange?: (state: MediaState) => void;
  /** 入力フォーム連携用: name 指定すると hidden input を出す */
  formNames?: {
    main?: string;
    galleryImages?: string;
    galleryVideos?: string;
  };
  compact?: boolean;
};

const DEFAULT_BUCKET = "restaurant-photos";

export function MediaUploader({
  initialMain,
  initialGalleryImages = [],
  initialGalleryVideos = [],
  storageBucket = DEFAULT_BUCKET,
  storagePathPrefix,
  onChange,
  formNames,
  compact = false,
}: Props) {
  const [media, setMedia] = useState<UploadedMedia[]>(() => {
    const items: UploadedMedia[] = [];
    if (initialMain) {
      items.push({
        url: initialMain,
        kind: "image",
        localId: `init-main-${initialMain}`,
        fromExternal: true,
      });
    }
    initialGalleryImages.forEach((url, i) => {
      if (url && url !== initialMain) {
        items.push({
          url,
          kind: "image",
          localId: `init-img-${i}-${url}`,
          fromExternal: true,
        });
      }
    });
    initialGalleryVideos.forEach((url, i) => {
      if (url) {
        items.push({
          url,
          kind: "video",
          localId: `init-vid-${i}-${url}`,
          fromExternal: true,
        });
      }
    });
    return items;
  });
  const [mainImageUrl, setMainImageUrl] = useState(initialMain ?? "");
  const inputId = useId();

  // 親コンポーネントへの状態通知
  useEffect(() => {
    if (!onChange) return;
    const galleryImages = media
      .filter((m) => m.kind === "image" && m.url && m.url !== mainImageUrl)
      .map((m) => m.url);
    const galleryVideos = media
      .filter((m) => m.kind === "video" && m.url)
      .map((m) => m.url);
    onChange({
      main: mainImageUrl,
      galleryImages,
      galleryVideos,
      allUploaded: media.every((m) => !m.uploading),
    });
  }, [media, mainImageUrl, onChange]);

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
      const path = `${storagePathPrefix}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(storageBucket)
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
        .from(storageBucket)
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

  /** 外部 URL を直接追加 (Tabelog ギャラリー等を後から取り込みたい時用) */
  function addExternalImages(urls: string[]) {
    const newItems: UploadedMedia[] = urls
      .filter((u) => u && !media.some((m) => m.url === u))
      .map((u) => ({
        url: u,
        kind: "image" as const,
        localId: `ext-${u}`,
        fromExternal: true,
      }));
    if (newItems.length > 0) {
      setMedia((prev) => [...prev, ...newItems]);
    }
  }

  // 親が外部画像を追加したい時のために window 上に公開
  useEffect(() => {
    (window as unknown as { __mediaUploaderAddImages?: (urls: string[]) => void }).__mediaUploaderAddImages =
      addExternalImages;
    return () => {
      delete (window as unknown as { __mediaUploaderAddImages?: unknown })
        .__mediaUploaderAddImages;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const galleryImages = media
    .filter((m) => m.kind === "image" && m.url && m.url !== mainImageUrl)
    .map((m) => m.url);
  const galleryVideos = media
    .filter((m) => m.kind === "video" && m.url)
    .map((m) => m.url);

  return (
    <div className="space-y-4">
      {/* 取り込みボタン (写真 + 動画) */}
      <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-3"}>
        <label className="qa-capture-btn">
          <input
            id={`${inputId}-img`}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, true)}
          />
          <span className="text-2xl">📷</span>
          <span className="text-[11px] tracking-[0.3em] text-[color:var(--color-gold)]">
            PHOTO
          </span>
        </label>
        <label className="qa-capture-btn">
          <input
            id={`${inputId}-vid`}
            type="file"
            accept="video/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e)}
          />
          <span className="text-2xl">🎬</span>
          <span className="text-[11px] tracking-[0.3em] text-[color:var(--color-gold)]">
            VIDEO
          </span>
        </label>
      </div>

      {/* 既存メディアグリッド */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
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

      {/* form 連携用 hidden inputs */}
      {formNames?.main && (
        <input type="hidden" name={formNames.main} value={mainImageUrl} />
      )}
      {formNames?.galleryImages && (
        <input
          type="hidden"
          name={formNames.galleryImages}
          value={galleryImages.join("\n")}
        />
      )}
      {formNames?.galleryVideos && (
        <input
          type="hidden"
          name={formNames.galleryVideos}
          value={galleryVideos.join("\n")}
        />
      )}

      <p className="text-[10px] text-[color:var(--color-text-faded)]">
        画像 {galleryImages.length + (mainImageUrl ? 1 : 0)} 枚 ・ 動画 {galleryVideos.length} 本
      </p>
    </div>
  );
}

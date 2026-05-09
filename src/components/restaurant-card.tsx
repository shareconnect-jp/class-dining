import Image from "next/image";
import Link from "next/link";
import type { Restaurant } from "@/lib/types";
import { genreSlugToName } from "@/lib/types";
import { ScoreBar } from "./score-bar";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const r = restaurant;
  const priceLabel =
    r.price_min && r.price_max
      ? `¥${r.price_min.toLocaleString()} 〜 ¥${r.price_max.toLocaleString()}`
      : null;
  return (
    <Link
      href={`/restaurants/${r.slug}`}
      className="luxury-card block overflow-hidden group"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--color-bg-soft)]">
        {r.main_image_url ? (
          // Unsplashなど外部画像。next.config.ts で remotePatterns 許可済み前提
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.main_image_url}
            alt={r.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[color:var(--color-text-faded)] text-xs">
            no image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {r.private_room && (
            <span className="px-2 py-1 text-[10px] tracking-widest bg-black/60 backdrop-blur text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40">
              個室
            </span>
          )}
          {r.vip_available && (
            <span className="px-2 py-1 text-[10px] tracking-widest bg-black/60 backdrop-blur text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40">
              VIP
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[color:var(--color-gold)] mb-3">
          <span>{r.prefecture}</span>
          <span className="opacity-40">/</span>
          <span>{genreSlugToName(r.genre ?? "")}</span>
        </div>
        <h3 className="font-serif text-lg sm:text-xl mb-3 group-hover:text-[color:var(--color-gold)] transition-colors">
          {r.name}
        </h3>
        <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed line-clamp-2 mb-5">
          {r.description}
        </p>
        <div className="space-y-1.5 mb-5">
          <ScoreBar label="接待" value={r.business_dining_score} />
          <ScoreBar label="静かさ" value={r.quietness_score} />
          <ScoreBar label="会話" value={r.conversation_score} />
        </div>
        <div className="pt-4 border-t border-[color:var(--color-border-soft)] flex items-center justify-between gap-3">
          {priceLabel ? (
            <span className="text-xs text-[color:var(--color-text-muted)] tracking-wider">
              {priceLabel}
            </span>
          ) : (
            <span />
          )}
          {r.tabelog_url && (
            <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/40 px-2 py-1 whitespace-nowrap">
              予約可
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { VersionChecker } from "@/components/version-checker";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CLASS DINING | 経営者・士業のための接待・出張グルメメディア",
    template: "%s | CLASS DINING",
  },
  description:
    "経営者・弁護士・税理士・医師・金融関係者のための、接待・会食・出張に使える高級飲食店メディア。個室・静かさ・VIP対応など、ビジネス利用に特化した評価軸で名店を厳選。",
  metadataBase: new URL("https://class-dining.example.com"),
  openGraph: {
    title: "CLASS DINING",
    description: "経営者・士業のための接待・出張グルメメディア",
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <head>
        {/* HTML 自体のキャッシュを最小化 (HTTPヘッダと併用、ブラウザによっては効く) */}
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body>
        {children}
        <VersionChecker />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Sans } from "next/font/google";
import "../globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "RADIANCE - 心と体を輝かせるライフスタイルマガジン",
  description: "ヨガ、ピラティス、フィットネス、ウェルネスに関する情報を発信するライフスタイルメディア",
  openGraph: {
    title: "RADIANCE - 心と体を輝かせるライフスタイルマガジン",
    description: "ヨガ、ピラティス、フィットネス、ウェルネスに関する情報を発信するライフスタイルメディア",
    type: "website",
    locale: "ja_JP",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${notoSans.variable} antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}

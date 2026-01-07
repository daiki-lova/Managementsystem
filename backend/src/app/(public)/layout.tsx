import type { Metadata } from "next";

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
  return <>{children}</>;
}

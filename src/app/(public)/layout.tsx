import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ALIGN - 心と体を整えるライフスタイルマガジン",
  description: "ヨガ、ピラティス、フィットネス、ウェルネスに関する情報を発信するライフスタイルメディア",
  openGraph: {
    title: "ALIGN - 心と体を整えるライフスタイルマガジン",
    description: "ヨガ、ピラティス、フィットネス、ウェルネスに関する情報を発信するライフスタイルメディア",
    type: "website",
    locale: "ja_JP",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}

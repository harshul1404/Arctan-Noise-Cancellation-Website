import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Qwen LiveTranslate Dubbing",
  description: "Translate transcripts and generate dubbed audio or video with Qwen3-LiveTranslate-Flash."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="https://framerusercontent.com/assets/P3OjLjGu6v81n98w2gJu394bcVY.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="https://framerusercontent.com/assets/vj1ePfzjNhdO4y4kOKfTXMmk9Q.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

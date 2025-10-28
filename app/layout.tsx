import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./layout.providers";
import { AppLayout } from "./AppLayout";

export const metadata: Metadata = {
  title: "vids.tube - Create YouTube Shorts from Long Videos",
  description: "Create YouTube Shorts from long-form YouTube videos. Position and scale a portrait crop frame, create multiple clips with different timestamps, and download combined videos.",
  keywords: ["YouTube Shorts", "video editing", "crop video", "video clips", "YouTube", "video tool"],
  authors: [{ name: "vids.tube" }],
  openGraph: {
    title: "vids.tube - Create YouTube Shorts from Long Videos",
    description: "Create YouTube Shorts from long-form YouTube videos with easy cropping and editing tools.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}

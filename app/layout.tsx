import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "vids.tube - YouTube Shorts Creator",
  description: "Create YouTube Shorts from long-form content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

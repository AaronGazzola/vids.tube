"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            vids.tube
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} vids.tube. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

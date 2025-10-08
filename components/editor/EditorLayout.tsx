"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EditorLayoutProps, EditorSidebarProps } from "./EditorLayout.types";

function EditorHeader() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-xl font-bold">YouTube Clip Editor</h1>
      </div>
    </header>
  );
}

function EditorSidebar({ isOpen, onToggle, children }: EditorSidebarProps) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 right-0 z-40 w-full sm:w-96 bg-background border-l transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 pt-16 lg:pt-4">{children}</div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}

export function EditorLayout({ children }: EditorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen">
      <EditorHeader />
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}

EditorLayout.Sidebar = EditorSidebar;

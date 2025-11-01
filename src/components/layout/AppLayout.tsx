"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";

interface AppLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export function AppLayout({ children, showNavbar = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
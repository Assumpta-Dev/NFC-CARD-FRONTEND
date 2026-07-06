import type { ReactNode } from "react";
import Navbar from "./navbar";
import { MarketingFooter } from "./MarketingFooter";

interface PublicLayoutProps {
  children: ReactNode;
  /** Hide footer (auth pages) */
  footer?: boolean;
  /** Narrow centered content */
  narrow?: boolean;
  className?: string;
}

export function PublicLayout({
  children,
  footer = true,
  narrow = false,
  className = "",
}: PublicLayoutProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-white dark:bg-gray-950 ${className}`}>
      <Navbar />
      <main
        className={`flex-1 pt-[4.5rem] ${
          narrow ? "flex items-center justify-center px-4 py-10" : ""
        }`}
      >
        {narrow ? (
          <div className="w-full max-w-md">{children}</div>
        ) : (
          children
        )}
      </main>
      {footer && <MarketingFooter />}
    </div>
  );
}

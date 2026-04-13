"use client";

import { EmailProvider } from "./providers";
import PWARegister from "./components/PWARegister";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <EmailProvider>
      <PWARegister />
      {children}
    </EmailProvider>
  );
}

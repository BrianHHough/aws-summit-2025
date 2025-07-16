import React, { Suspense } from "react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading chat…</div>}>
      {children}
    </Suspense>
  );
}
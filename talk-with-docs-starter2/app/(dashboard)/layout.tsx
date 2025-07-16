"use client"

import DashboardNav from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Fixed sidebar */}
      <div className="fixed top-0 left-0 w-[240px] lg:w-[280px] h-screen">
        <DashboardNav />
      </div>

      {/* Main content with offset margin and scrollable area */}
      <div
        id="dashboard"
        className="flex flex-col ml-[240px] lg:ml-[280px] w-[calc(100%-240px)] lg:w-[calc(100%-280px)]"
      >
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

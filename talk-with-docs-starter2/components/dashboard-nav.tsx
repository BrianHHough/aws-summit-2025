"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { emailToHandle } from "@/lib/email-utils";
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  Upload,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardNav() {
  const { data: session, status } = useSession();

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Documents", href: "/dashboard/documents", icon: FileText },
    { title: "Upload", href: "/dashboard/upload", icon: Upload },
    { title: "Chats", href: "/dashboard/chats", icon: MessageSquare },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <FileText className="h-5 w-5" />
          <span>TalkWithDocs</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {navItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "hover:bg-transparent hover:underline justify-start gap-2"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        {session?.user && (
          <div className="flex items-center gap-2 py-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-medium">Welcome back,</p>
              <div className="relative overflow-hidden pr-2">
                <p className="text-sm text-muted-foreground truncate">
                  {emailToHandle(session.user.email)}
                </p>
                {/* <p>Signed in as {session.user.sub}</p> */}
                
              </div>
            </div>
          </div>
        )}
        <div className="ml-2">
          <br/>
          <p className="text-sm">Powered By: <br/> <span className="font-bold">Tech Stack Playbook</span></p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t mt-2">
          <ThemeToggle />
          <Link href="/api/auth/signout">
            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

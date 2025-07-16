import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, FileText, Lock, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 mr-4">
          <div className="flex gap-2 items-center text-xl font-bold pl-4 md:pl-4">
            <FileText className="h-6 w-6" />
            <span>TalkWithDocs</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-sm font-medium"
                )}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "text-sm font-medium"
                )}
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Have conversations with your documents
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Upload your PDFs and ask questions in natural language. Get instant, accurate answers powered by AI.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link 
                    href="/register" 
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "gap-1"
                    )}
                  >
                    Start for free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link 
                    href="/login" 
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" })
                    )}
                  >
                    Login to your account
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative aspect-video overflow-hidden rounded-xl border bg-background sm:w-full lg:order-last">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-background p-8 flex flex-col justify-center items-center gap-4">
                    <div className="w-full h-24 rounded-lg bg-card border shadow-sm flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload your documents</span>
                      </div>
                    </div>
                    <div className="w-full h-40 rounded-lg bg-card border shadow-sm p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-start">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                            U
                          </div>
                          <div className="bg-muted p-3 rounded-lg rounded-tl-none text-sm max-w-[80%]">
                            What are the key points in this document?
                          </div>
                        </div>
                        <div className="flex gap-2 items-start justify-end">
                          <div className="bg-primary/20 p-3 rounded-lg rounded-tr-none text-sm max-w-[80%]">
                            Based on the document, there are 3 main points...
                          </div>
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
                            AI
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Features that make document chat powerful
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to get answers from your documents in seconds
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 max-w-5xl">
                <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="rounded-full bg-primary/20 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">PDF Processing</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Upload any PDF document and our system will process it for intelligent querying.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">AI-Powered Answers</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Get accurate answers to your questions based on the content of your documents.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Secure Storage</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Your documents are stored securely and are only accessible by you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 md:py-0">
        <div className="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
          <p className="text-sm text-muted-foreground">
            © 2025 TalkWithDocs. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
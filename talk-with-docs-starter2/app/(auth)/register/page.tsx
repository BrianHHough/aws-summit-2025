"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function handleSignUpRedirect() {
    setIsLoading(true);
    try {
      const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
      const redirectUri = `${window.location.origin}/api/auth/callback/cognito`;

      const signupUrl = `https://${domain}/signup` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&scope=email+openid+profile` +
        `&screen_hint=signup`;


        
      window.location.href = signupUrl;
    } catch (err) {
      setIsLoading(false);
      toast({
        title: "Sign up failed",
        description: "Could not redirect to Cognito sign-up.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="mx-auto grid w-full max-w-md gap-6">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xl font-bold">TalkWithDocs</span>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            You’ll be redirected to sign up through Cognito
          </p>
        </div>
        <div className="grid gap-6">
          <Button
            onClick={handleSignUpRedirect}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Sign Up with Cognito"
            )}
          </Button>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

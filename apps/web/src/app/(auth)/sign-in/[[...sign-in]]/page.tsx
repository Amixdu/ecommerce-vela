import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-sm font-black tracking-[0.25em] uppercase text-foreground hover:opacity-70 transition-opacity"
        >
          Vela
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your Vela account
          </p>
        </div>
        <SignIn fallbackRedirectUrl="/" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { LogoPhoto } from "@/components/brand/logo-photo";
import { WordmarkPhoto } from "@/components/brand/wordmark-photo";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex flex-col items-center gap-2">
          <LogoPhoto size={56} />
          <WordmarkPhoto width={200} />
        </Link>
        <Card>
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import { WordmarkPhoto } from "@/components/brand/wordmark-photo";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex justify-center">
          <WordmarkPhoto width={220} />
        </Link>
        <Card>
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

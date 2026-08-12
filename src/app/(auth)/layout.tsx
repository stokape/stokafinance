import Link from "next/link";
import { LogoPhoto } from "@/components/brand/logo-photo";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex flex-col items-center gap-2 text-center">
          <LogoPhoto size={56} />
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-foreground">STOKA</span> <span style={{ color: "#00C8A3" }}>FINANCE</span>
          </span>
          <span className="text-xs text-muted-foreground">Control financiero personal</span>
        </Link>
        <Card>
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

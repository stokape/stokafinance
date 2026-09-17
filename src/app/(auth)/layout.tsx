import type { Metadata } from "next";
import Link from "next/link";
import { LogoPhoto } from "@/components/brand/logo-photo";
import { WordmarkPhoto } from "@/components/brand/wordmark-photo";
import { Card, CardContent } from "@/components/ui/card";

// Las rutas de auth (login, registro, recuperar/resetear contraseña) no
// aportan nada a un visitante que llega desde una búsqueda -- son pantallas
// de credenciales, no contenido. Ninguna página hija de este layout define
// `robots` propio, así que heredan este valor sin cambios adicionales.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

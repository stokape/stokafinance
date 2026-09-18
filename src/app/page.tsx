import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomeExperience } from "@/components/marketing/home-experience";

export const metadata: Metadata = {
  title: "Control financiero personal",
  description:
    "Entiende tu dinero hoy y anticipa lo que viene con cuentas, presupuestos, deudas, metas y proyecciones en un solo lugar.",
};

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HomeExperience isAuthenticated={Boolean(user)} />;
}

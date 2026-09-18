import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  redirect("/#precios");
}

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NetWorthService } from "@/features/net-worth/services/net-worth.service";
import { createAssetSchema, createLiabilitySchema } from "@/features/net-worth/validations/net-worth.schema";
import { actionError, actionSuccess, type ActionResult } from "@/types/action-result";
import { logger } from "@/lib/utils/logger";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

function revalidateAfterMutation() {
  revalidatePath("/net-worth");
  revalidatePath("/dashboard");
}

export async function createAssetAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createAssetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  try {
    const { supabase, user } = await requireUser();
    await new NetWorthService(supabase).createAsset(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_asset_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el activo. Intenta nuevamente.");
  }
}

export async function deleteAssetAction(assetId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new NetWorthService(supabase).deleteAsset(assetId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("delete_asset_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos eliminar el activo. Intenta nuevamente.");
  }
}

export async function createLiabilityAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = createLiabilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("Revisa los campos del formulario.", parsed.error.flatten().fieldErrors);
  try {
    const { supabase, user } = await requireUser();
    await new NetWorthService(supabase).createLiability(user.id, parsed.data);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("create_liability_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos registrar el pasivo. Intenta nuevamente.");
  }
}

export async function deleteLiabilityAction(liabilityId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    await new NetWorthService(supabase).deleteLiability(liabilityId);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("delete_liability_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos eliminar el pasivo. Intenta nuevamente.");
  }
}

export async function saveSnapshotAction(): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    await new NetWorthService(supabase).saveTodaySnapshot(user.id);
    revalidateAfterMutation();
    return actionSuccess(undefined);
  } catch (error) {
    logger.error("save_snapshot_failed", { error: error instanceof Error ? error.message : String(error) });
    return actionError("No pudimos guardar el snapshot. Intenta nuevamente.");
  }
}

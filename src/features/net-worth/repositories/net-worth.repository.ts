import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Asset, Liability, SnapshotPoint } from "../types/net-worth.types";

function mapAsset(row: Database["public"]["Tables"]["assets"]["Row"]): Asset {
  return { id: row.id, name: row.name, assetType: row.asset_type, currentValue: row.current_value, currency: row.currency, notes: row.notes };
}

function mapLiability(row: Database["public"]["Tables"]["liabilities"]["Row"]): Liability {
  return {
    id: row.id,
    name: row.name,
    liabilityType: row.liability_type,
    currentBalance: row.current_balance,
    currency: row.currency,
    notes: row.notes,
  };
}

/**
 * Único punto de acceso a Supabase para `assets`/`liabilities`/
 * `financial_snapshots`. RLS filtra por user_id = auth.uid(). A diferencia
 * de las tablas transaccionales, `assets`/`liabilities` no tienen
 * `deleted_at` (no son historial financiero inmutable, son declaraciones
 * de patrimonio editables) — por eso aquí sí se hace DELETE real.
 */
export class NetWorthRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listAssets(): Promise<Asset[]> {
    const { data, error } = await this.supabase.from("assets").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapAsset);
  }

  async listLiabilities(): Promise<Liability[]> {
    const { data, error } = await this.supabase.from("liabilities").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapLiability);
  }

  async createAsset(userId: string, input: Omit<Database["public"]["Tables"]["assets"]["Insert"], "user_id">): Promise<void> {
    const { error } = await this.supabase.from("assets").insert({ ...input, user_id: userId });
    if (error) throw error;
  }

  async deleteAsset(id: string): Promise<void> {
    const { error } = await this.supabase.from("assets").delete().eq("id", id);
    if (error) throw error;
  }

  async createLiability(userId: string, input: Omit<Database["public"]["Tables"]["liabilities"]["Insert"], "user_id">): Promise<void> {
    const { error } = await this.supabase.from("liabilities").insert({ ...input, user_id: userId });
    if (error) throw error;
  }

  async deleteLiability(id: string): Promise<void> {
    const { error } = await this.supabase.from("liabilities").delete().eq("id", id);
    if (error) throw error;
  }

  async upsertSnapshot(
    userId: string,
    snapshot: {
      snapshotDate: string;
      totalAssets: string;
      totalLiabilities: string;
      netWorth: string;
      cash: string;
      debt: string;
      investments: string;
    },
  ): Promise<void> {
    const { error } = await this.supabase.from("financial_snapshots").upsert(
      {
        user_id: userId,
        snapshot_date: snapshot.snapshotDate,
        total_assets: snapshot.totalAssets,
        total_liabilities: snapshot.totalLiabilities,
        net_worth: snapshot.netWorth,
        cash: snapshot.cash,
        debt: snapshot.debt,
        investments: snapshot.investments,
      },
      { onConflict: "user_id,snapshot_date" },
    );
    if (error) throw error;
  }

  async listSnapshots(limit = 12): Promise<SnapshotPoint[]> {
    const { data, error } = await this.supabase
      .from("financial_snapshots")
      .select("snapshot_date, net_worth, total_assets, total_liabilities")
      .order("snapshot_date", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      date: row.snapshot_date,
      netWorth: Number(row.net_worth),
      totalAssets: Number(row.total_assets),
      totalLiabilities: Number(row.total_liabilities),
    }));
  }
}

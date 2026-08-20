import type { UserRole } from "./auth";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ManagementSettingRow = { setting_key: string; value: unknown; value_type: "number" | "string" | "boolean" | "object" | "array"; description: string | null; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProfileRow, "id">>;
        Relationships: [];
      };
      management_settings: {
        Row: ManagementSettingRow;
        Insert: Omit<ManagementSettingRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<ManagementSettingRow, "setting_key" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: { user_role: UserRole };
    CompositeTypes: Record<never, never>;
  };
  analytics: {
    Tables: Record<never, never>;
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

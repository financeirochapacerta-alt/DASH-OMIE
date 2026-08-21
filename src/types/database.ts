// Generated from the real remote schema: npx supabase gen types typescript --linked > src/types/database.ts
// Regenerate after any migration that changes a table/view/function.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  analytics: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      bank_account_reconciliation: {
        Row: {
          balance_date: string | null
          bank_account_id: number | null
          blocked: boolean | null
          computed_balance: number | null
          description: string | null
          effective_balance_date: string | null
          effective_opening_balance: number | null
          inactive: boolean | null
          initial_balance: number | null
          manual_balance_date: string | null
          manual_balance_enabled: boolean | null
          manual_balance_updated_at: string | null
          manual_opening_balance: number | null
          omie_id: string | null
          selected_for_cash: boolean | null
        }
        Relationships: []
      }
      cash_account_balances: {
        Row: {
          balance_date: string | null
          bank_account_id: number | null
          current_balance: number | null
          description: string | null
          effective_balance_date: string | null
          effective_opening_balance: number | null
          initial_balance: number | null
          manual_balance_date: string | null
          manual_balance_enabled: boolean | null
          manual_opening_balance: number | null
          omie_id: string | null
        }
        Relationships: []
      }
      cash_current_balance: {
        Row: {
          current_balance: number | null
        }
        Relationships: []
      }
      cash_projection_daily: {
        Row: {
          closing_balance: number | null
          inflows: number | null
          net_flow: number | null
          opening_balance: number | null
          outflows: number | null
          projection_date: string | null
        }
        Relationships: []
      }
      cash_projection_monthly: {
        Row: {
          closing_balance: number | null
          inflows: number | null
          month_start: string | null
          net_flow: number | null
          outflows: number | null
        }
        Relationships: []
      }
      cash_projection_movements: {
        Row: {
          id: number | null
          is_overdue: boolean | null
          movement_type: string | null
          omie_id: string | null
          original_due_date: string | null
          projection_date: string | null
          signed_value: number | null
        }
        Relationships: []
      }
      cash_projection_summary: {
        Row: {
          first_below_minimum_cash_date: string | null
          first_negative_cash_date: string | null
          minimum_cash: number | null
          overdue_concentration: number | null
          projected_inflows: number | null
          projected_outflows: number | null
        }
        Relationships: []
      }
      cash_realized_daily: {
        Row: {
          inflows: number | null
          movement_date: string | null
          net_flow: number | null
          outflows: number | null
        }
        Relationships: []
      }
      cash_realized_monthly: {
        Row: {
          inflows: number | null
          month_start: string | null
          net_flow: number | null
          outflows: number | null
        }
        Relationships: []
      }
      customer_abc: {
        Row: {
          abc_class: string | null
          cumulative_percent: number | null
          customer_id: number | null
          customer_name: string | null
          share_percent: number | null
          total_value: number | null
        }
        Relationships: []
      }
      dre_cumulative: {
        Row: {
          account_order: number | null
          amount: number | null
          category_id: number | null
          category_name: string | null
          cumulative_amount: number | null
          dre_account: string | null
          dre_group: string | null
          dre_type: string | null
          group_order: number | null
          mapping_status: string | null
          month: string | null
          title_count: number | null
          type_order: number | null
        }
        Relationships: []
      }
      dre_details: {
        Row: {
          account_order: number | null
          category_id: number | null
          category_name: string | null
          dre_account: string | null
          dre_group: string | null
          dre_type: string | null
          due_date: string | null
          group_order: number | null
          id: number | null
          mapping_source: string | null
          mapping_status: string | null
          month: string | null
          movement_type: string | null
          omie_id: string | null
          signed_value: number | null
          type_order: number | null
        }
        Relationships: []
      }
      dre_monthly: {
        Row: {
          account_order: number | null
          amount: number | null
          category_id: number | null
          category_name: string | null
          dre_account: string | null
          dre_group: string | null
          dre_type: string | null
          group_order: number | null
          mapping_source: string | null
          mapping_status: string | null
          month: string | null
          title_count: number | null
          type_order: number | null
        }
        Relationships: []
      }
      financial_movements: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          category_name: string | null
          customer_id: number | null
          customer_name: string | null
          document_number: string | null
          due_date: string | null
          forecast_date: string | null
          id: number | null
          is_cancelled: boolean | null
          is_settled: boolean | null
          issue_date: string | null
          movement_type: string | null
          omie_id: string | null
          original_value: number | null
          seller_id: number | null
          signed_value: number | null
          status: string | null
        }
        Relationships: []
      }
      open_payables: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          created_at: string | null
          customer_id: number | null
          document_number: string | null
          due_date: string | null
          forecast_date: string | null
          id: number | null
          installment_number: string | null
          is_cancelled: boolean | null
          is_settled: boolean | null
          issue_date: string | null
          last_synced_at: string | null
          omie_id: string | null
          original_value: number | null
          seller_id: number | null
          signed_value: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_account_reconciliation"
            referencedColumns: ["bank_account_id"]
          },
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account_balances"
            referencedColumns: ["bank_account_id"]
          },
        ]
      }
      open_receivables: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          created_at: string | null
          customer_id: number | null
          document_number: string | null
          due_date: string | null
          forecast_date: string | null
          id: number | null
          installment_number: string | null
          is_cancelled: boolean | null
          is_settled: boolean | null
          issue_date: string | null
          last_synced_at: string | null
          omie_id: string | null
          original_value: number | null
          seller_id: number | null
          signed_value: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_account_reconciliation"
            referencedColumns: ["bank_account_id"]
          },
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account_balances"
            referencedColumns: ["bank_account_id"]
          },
        ]
      }
      overdue_payables: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          created_at: string | null
          customer_id: number | null
          document_number: string | null
          due_date: string | null
          forecast_date: string | null
          id: number | null
          installment_number: string | null
          is_cancelled: boolean | null
          is_settled: boolean | null
          issue_date: string | null
          last_synced_at: string | null
          omie_id: string | null
          original_value: number | null
          seller_id: number | null
          signed_value: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_account_reconciliation"
            referencedColumns: ["bank_account_id"]
          },
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account_balances"
            referencedColumns: ["bank_account_id"]
          },
        ]
      }
      overdue_receivables: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          created_at: string | null
          customer_id: number | null
          document_number: string | null
          due_date: string | null
          forecast_date: string | null
          id: number | null
          installment_number: string | null
          is_cancelled: boolean | null
          is_settled: boolean | null
          issue_date: string | null
          last_synced_at: string | null
          omie_id: string | null
          original_value: number | null
          seller_id: number | null
          signed_value: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string | null
          customer_id?: number | null
          document_number?: string | null
          due_date?: string | null
          forecast_date?: string | null
          id?: number | null
          installment_number?: string | null
          is_cancelled?: boolean | null
          is_settled?: boolean | null
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string | null
          original_value?: number | null
          seller_id?: number | null
          signed_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_account_reconciliation"
            referencedColumns: ["bank_account_id"]
          },
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account_balances"
            referencedColumns: ["bank_account_id"]
          },
        ]
      }
      payables_heatmap: {
        Row: {
          overdue_count: number | null
          overdue_value: number | null
          payment_count: number | null
          payment_value: number | null
          projection_date: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          billing_status: string | null
          contract_number: string | null
          customer_id: number | null
          customer_name: string | null
          display_number: string | null
          forecast_date: string | null
          id: number | null
          inclusion_date: string | null
          invoice_date: string | null
          is_cancelled: boolean | null
          omie_id: string | null
          seller_id: number | null
          seller_name: string | null
          source: string | null
          stage_classification: string | null
          stage_code: string | null
          total_value: number | null
        }
        Relationships: []
      }
      sales_by_customer: {
        Row: {
          average_value: number | null
          customer_id: number | null
          customer_name: string | null
          last_invoice_date: string | null
          sale_count: number | null
          sales_rank: number | null
          total_value: number | null
        }
        Relationships: []
      }
      sales_by_seller: {
        Row: {
          average_value: number | null
          invoiced_value: number | null
          sale_count: number | null
          sales_rank: number | null
          seller_id: number | null
          seller_name: string | null
          to_invoice_value: number | null
          total_value: number | null
        }
        Relationships: []
      }
      sales_pipeline: {
        Row: {
          billing_status: string | null
          sale_count: number | null
          source: string | null
          stage_classification: string | null
          stage_code: string | null
          total_value: number | null
        }
        Relationships: []
      }
      sales_summary: {
        Row: {
          average_value: number | null
          invoiced_value: number | null
          sale_count: number | null
          to_invoice_value: number | null
          total_value: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      customer_abc_period: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          abc_class: string
          cumulative_percent: number
          customer_id: number
          customer_name: string
          share_percent: number
          total_value: number
        }[]
      }
      sales_by_seller_period: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          average_value: number
          invoiced_value: number
          sale_count: number
          sales_rank: number
          seller_id: number
          seller_name: string
          to_invoice_value: number
          total_value: number
        }[]
      }
      sales_pipeline_period: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          billing_status: string
          sale_count: number
          source: string
          stage_classification: string
          stage_code: string
          total_value: number
        }[]
      }
      sales_summary_period: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          average_value: number
          invoiced_value: number
          sale_count: number
          to_invoice_value: number
          total_value: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          created_at: string
          customer_id: number | null
          document_number: string | null
          due_date: string
          forecast_date: string | null
          id: number
          installment_number: string | null
          is_cancelled: boolean
          is_settled: boolean
          issue_date: string | null
          last_synced_at: string | null
          omie_id: string
          original_value: number
          seller_id: number | null
          signed_value: number | null
          source_payload_hash: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string
          customer_id?: number | null
          document_number?: string | null
          due_date: string
          forecast_date?: string | null
          id?: never
          installment_number?: string | null
          is_cancelled?: boolean
          is_settled?: boolean
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id: string
          original_value: number
          seller_id?: number | null
          signed_value?: number | null
          source_payload_hash?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string
          customer_id?: number | null
          document_number?: string | null
          due_date?: string
          forecast_date?: string | null
          id?: never
          installment_number?: string | null
          is_cancelled?: boolean
          is_settled?: boolean
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string
          original_value?: number
          seller_id?: number | null
          signed_value?: number | null
          source_payload_hash?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          bank_account_id: number | null
          category_id: number | null
          created_at: string
          customer_id: number | null
          document_number: string | null
          due_date: string
          forecast_date: string | null
          id: number
          installment_number: string | null
          is_cancelled: boolean
          is_settled: boolean
          issue_date: string | null
          last_synced_at: string | null
          omie_id: string
          original_value: number
          seller_id: number | null
          signed_value: number | null
          source_payload_hash: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string
          customer_id?: number | null
          document_number?: string | null
          due_date: string
          forecast_date?: string | null
          id?: never
          installment_number?: string | null
          is_cancelled?: boolean
          is_settled?: boolean
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id: string
          original_value: number
          seller_id?: number | null
          signed_value?: number | null
          source_payload_hash?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          bank_account_id?: number | null
          category_id?: number | null
          created_at?: string
          customer_id?: number | null
          document_number?: string | null
          due_date?: string
          forecast_date?: string | null
          id?: never
          installment_number?: string | null
          is_cancelled?: boolean
          is_settled?: boolean
          issue_date?: string | null
          last_synced_at?: string | null
          omie_id?: string
          original_value?: number
          seller_id?: number | null
          signed_value?: number | null
          source_payload_hash?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_type: string | null
          balance_date: string | null
          blocked: boolean
          created_at: string
          description: string
          id: number
          inactive: boolean
          initial_balance: number
          last_synced_at: string | null
          manual_balance_date: string | null
          manual_balance_enabled: boolean
          manual_balance_updated_at: string | null
          manual_opening_balance: number | null
          omie_id: string
          selected_for_cash: boolean
          source_payload_hash: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string | null
          balance_date?: string | null
          blocked?: boolean
          created_at?: string
          description: string
          id?: never
          inactive?: boolean
          initial_balance?: number
          last_synced_at?: string | null
          manual_balance_date?: string | null
          manual_balance_enabled?: boolean
          manual_balance_updated_at?: string | null
          manual_opening_balance?: number | null
          omie_id: string
          selected_for_cash?: boolean
          source_payload_hash?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string | null
          balance_date?: string | null
          blocked?: boolean
          created_at?: string
          description?: string
          id?: never
          inactive?: boolean
          initial_balance?: number
          last_synced_at?: string | null
          manual_balance_date?: string | null
          manual_balance_enabled?: boolean
          manual_balance_updated_at?: string | null
          manual_opening_balance?: number | null
          omie_id?: string
          selected_for_cash?: boolean
          source_payload_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          codigo_dre: string | null
          created_at: string
          dre_metadata: Json | null
          id: number
          is_active: boolean
          last_synced_at: string | null
          name: string
          omie_id: string
          source_payload_hash: string | null
          updated_at: string
        }
        Insert: {
          codigo_dre?: string | null
          created_at?: string
          dre_metadata?: Json | null
          id?: never
          is_active?: boolean
          last_synced_at?: string | null
          name: string
          omie_id: string
          source_payload_hash?: string | null
          updated_at?: string
        }
        Update: {
          codigo_dre?: string | null
          created_at?: string
          dre_metadata?: Json | null
          id?: never
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          omie_id?: string
          source_payload_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          document_number: string | null
          id: number
          is_active: boolean
          last_synced_at: string | null
          legal_name: string
          omie_id: string
          source_payload_hash: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          id?: never
          is_active?: boolean
          last_synced_at?: string | null
          legal_name: string
          omie_id: string
          source_payload_hash?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          id?: never
          is_active?: boolean
          last_synced_at?: string | null
          legal_name?: string
          omie_id?: string
          source_payload_hash?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dre_category_mappings: {
        Row: {
          account_order: number
          active: boolean
          category_id: number
          created_at: string
          dre_account: string
          dre_group: string
          dre_type: string
          group_order: number
          id: number
          sign_behavior: string | null
          source: string
          type_order: number
          updated_at: string
        }
        Insert: {
          account_order?: number
          active?: boolean
          category_id: number
          created_at?: string
          dre_account: string
          dre_group: string
          dre_type: string
          group_order?: number
          id?: never
          sign_behavior?: string | null
          source: string
          type_order?: number
          updated_at?: string
        }
        Update: {
          account_order?: number
          active?: boolean
          category_id?: number
          created_at?: string
          dre_account?: string
          dre_group?: string
          dre_type?: string
          group_order?: number
          id?: never
          sign_behavior?: string | null
          source?: string
          type_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dre_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      management_settings: {
        Row: {
          created_at: string
          description: string | null
          setting_key: string
          updated_at: string
          value: Json
          value_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          setting_key: string
          updated_at?: string
          value: Json
          value_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          setting_key?: string
          updated_at?: string
          value?: Json
          value_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sales_order_installments: {
        Row: {
          amount: number | null
          created_at: string
          due_date: string
          id: number
          installment_number: string | null
          omie_reference: string | null
          sales_order_id: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          due_date: string
          id?: never
          installment_number?: string | null
          omie_reference?: string | null
          sales_order_id: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          due_date?: string
          id?: never
          installment_number?: string | null
          omie_reference?: string | null
          sales_order_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_installments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          cancelled_at: string | null
          contract_number: string | null
          created_at: string
          customer_id: number | null
          display_number: string | null
          enriched_at: string | null
          enrichment_status: string
          forecast_date: string | null
          id: number
          invoice_date: string | null
          is_cancelled: boolean | null
          last_synced_at: string | null
          omie_id: string
          real_due_date: string | null
          seller_id: number | null
          source_payload_hash: string | null
          stage_classification: string | null
          stage_code: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          contract_number?: string | null
          created_at?: string
          customer_id?: number | null
          display_number?: string | null
          enriched_at?: string | null
          enrichment_status?: string
          forecast_date?: string | null
          id?: never
          invoice_date?: string | null
          is_cancelled?: boolean | null
          last_synced_at?: string | null
          omie_id: string
          real_due_date?: string | null
          seller_id?: number | null
          source_payload_hash?: string | null
          stage_classification?: string | null
          stage_code?: string | null
          total_value: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          contract_number?: string | null
          created_at?: string
          customer_id?: number | null
          display_number?: string | null
          enriched_at?: string | null
          enrichment_status?: string
          forecast_date?: string | null
          id?: never
          invoice_date?: string | null
          is_cancelled?: boolean | null
          last_synced_at?: string | null
          omie_id?: string
          real_due_date?: string | null
          seller_id?: number | null
          source_payload_hash?: string | null
          stage_classification?: string | null
          stage_code?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          created_at: string
          email: string | null
          id: number
          is_active: boolean
          last_synced_at: string | null
          name: string
          omie_id: string
          source_payload_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: never
          is_active?: boolean
          last_synced_at?: string | null
          name: string
          omie_id: string
          source_payload_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: never
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          omie_id?: string
          source_payload_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          contract_number: string | null
          created_at: string
          customer_id: number | null
          display_number: string | null
          forecast_date: string | null
          id: number
          inclusion_date: string | null
          invoice_date: string | null
          is_cancelled: boolean | null
          last_synced_at: string | null
          omie_id: string
          real_due_date: string | null
          seller_id: number | null
          source_payload_hash: string | null
          stage_classification: string | null
          stage_code: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          contract_number?: string | null
          created_at?: string
          customer_id?: number | null
          display_number?: string | null
          forecast_date?: string | null
          id?: never
          inclusion_date?: string | null
          invoice_date?: string | null
          is_cancelled?: boolean | null
          last_synced_at?: string | null
          omie_id: string
          real_due_date?: string | null
          seller_id?: number | null
          source_payload_hash?: string | null
          stage_classification?: string | null
          stage_code?: string | null
          total_value: number
          updated_at?: string
        }
        Update: {
          contract_number?: string | null
          created_at?: string
          customer_id?: number | null
          display_number?: string | null
          forecast_date?: string | null
          id?: never
          inclusion_date?: string | null
          invoice_date?: string | null
          is_cancelled?: boolean | null
          last_synced_at?: string | null
          omie_id?: string
          real_due_date?: string | null
          seller_id?: number | null
          source_payload_hash?: string | null
          stage_classification?: string | null
          stage_code?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_mappings: {
        Row: {
          active: boolean
          classification: string
          created_at: string
          entity_type: string
          id: number
          label: string | null
          stage_code: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          classification: string
          created_at?: string
          entity_type: string
          id?: never
          label?: string | null
          stage_code: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          classification?: string
          created_at?: string
          entity_type?: string
          id?: never
          label?: string | null
          stage_code?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_active_locks: {
        Args: never
        Returns: {
          acquired_at: string
          entity_type: string
          expires_at: string
        }[]
      }
      admin_sync_status: {
        Args: never
        Returns: {
          duration_seconds: number
          entity_type: string
          finished_at: string
          records_failed: number
          records_inserted: number
          records_read: number
          records_unchanged: number
          records_updated: number
          started_at: string
          status: string
        }[]
      }
      operational_acquire_sync_lock: {
        Args: { entity: string; run_id: string; ttl_minutes?: number }
        Returns: undefined
      }
      operational_complete_sync_state: {
        Args: { entity: string; run_id: string; summary: Json }
        Returns: undefined
      }
      operational_finish_sync: {
        Args: { run_id: string; summary: Json }
        Returns: undefined
      }
      operational_list_raw: {
        Args: { entity: string }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "omie_records"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      operational_log_sync_error: {
        Args: { payload: Json }
        Returns: undefined
      }
      operational_release_sync_lock: {
        Args: { entity: string }
        Returns: undefined
      }
      operational_start_sync: {
        Args: { entity: string; sync_kind: string }
        Returns: string
      }
      operational_store_raw: { Args: { payload: Json }; Returns: undefined }
    }
    Enums: {
      user_role:
        | "ADMIN"
        | "DIRETORIA"
        | "FINANCEIRO"
        | "COMERCIAL"
        | "PRODUCAO"
        | "VIEWER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  analytics: {
    Enums: {},
  },
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: [
        "ADMIN",
        "DIRETORIA",
        "FINANCEIRO",
        "COMERCIAL",
        "PRODUCAO",
        "VIEWER",
      ],
    },
  },
} as const

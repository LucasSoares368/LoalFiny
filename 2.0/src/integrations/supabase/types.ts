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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          description: string | null
          icon: string | null
          id: string
          points: number | null
          title: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          description?: string | null
          icon?: string | null
          id?: string
          points?: number | null
          title: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          description?: string | null
          icon?: string | null
          id?: string
          points?: number | null
          title?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          allow_registration: boolean
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          allow_registration?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          allow_registration?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          setting_key: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          setting_key: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          setting_key?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_slug: string | null
          color: string | null
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean | null
          logo_url: string | null
          name: string
          notes: string | null
          opening_date: string | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_slug?: string | null
          color?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          notes?: string | null
          opening_date?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_slug?: string | null
          color?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          opening_date?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          profile_type: Database["public"]["Enums"]["profile_type"] | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          consent_date: string | null
          id: string
          preferences: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          consent_date?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          consent_date?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      custom_goals: {
        Row: {
          category: string | null
          color: string | null
          completed_at: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          description: string | null
          icon: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          notes: string | null
          payment_date: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          creditor: string | null
          current_balance: number
          due_day: number | null
          id: string
          interest_rate: number | null
          minimum_payment: number | null
          name: string
          notes: string | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          start_date: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creditor?: string | null
          current_balance: number
          due_day?: number | null
          id?: string
          interest_rate?: number | null
          minimum_payment?: number | null
          name: string
          notes?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          start_date?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creditor?: string | null
          current_balance?: number
          due_day?: number | null
          id?: string
          interest_rate?: number | null
          minimum_payment?: number | null
          name?: string
          notes?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          start_date?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          goal_type: string | null
          id: string
          target_amount: number | null
          target_months: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          goal_type?: string | null
          id?: string
          target_amount?: number | null
          target_months?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          goal_type?: string | null
          id?: string
          target_amount?: number | null
          target_months?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_api_config: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          id: string
          instance_name: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          id?: string
          instance_name: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          id?: string
          instance_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fixed_costs: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          is_variable: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_variable?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_variable?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_costs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_costs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mercado_pago_config: {
        Row: {
          access_token: string
          created_at: string
          id: string
          is_active: boolean
          public_key: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          is_active?: boolean
          public_key: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          public_key?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openai_config: {
        Row: {
          api_key: string
          created_at: string
          id: string
          model: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          model?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          model?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billing_period: string | null
          br_code: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          plan_id: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_period?: string | null
          br_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          plan_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_period?: string | null
          br_code?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          plan_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          advanced_dashboard_enabled: boolean | null
          annual_projection_enabled: boolean | null
          business_profile_enabled: boolean | null
          cashflow_projection_enabled: boolean | null
          created_at: string | null
          description: string | null
          export_enabled: boolean | null
          features: Json | null
          history_months: number | null
          id: string
          is_active: boolean | null
          max_banks: number | null
          max_goals: number | null
          max_reminders: number | null
          monthly_planning_enabled: boolean | null
          name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_monthly: number
          price_yearly: number
          reports_enabled: boolean | null
          split_enabled: boolean | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          advanced_dashboard_enabled?: boolean | null
          annual_projection_enabled?: boolean | null
          business_profile_enabled?: boolean | null
          cashflow_projection_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          export_enabled?: boolean | null
          features?: Json | null
          history_months?: number | null
          id?: string
          is_active?: boolean | null
          max_banks?: number | null
          max_goals?: number | null
          max_reminders?: number | null
          monthly_planning_enabled?: boolean | null
          name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_monthly?: number
          price_yearly?: number
          reports_enabled?: boolean | null
          split_enabled?: boolean | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          advanced_dashboard_enabled?: boolean | null
          annual_projection_enabled?: boolean | null
          business_profile_enabled?: boolean | null
          cashflow_projection_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          export_enabled?: boolean | null
          features?: Json | null
          history_months?: number | null
          id?: string
          is_active?: boolean | null
          max_banks?: number | null
          max_goals?: number | null
          max_reminders?: number | null
          monthly_planning_enabled?: boolean | null
          name?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price_monthly?: number
          price_yearly?: number
          reports_enabled?: boolean | null
          split_enabled?: boolean | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      price_records: {
        Row: {
          created_at: string | null
          date: string
          id: string
          price: number
          product_id: string
          quantity: number | null
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          price: number
          product_id: string
          quantity?: number | null
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          price?: number
          product_id?: string
          quantity?: number | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          onboarding_completed: boolean | null
          phone_number: string | null
          updated_at: string | null
          whatsapp_notifications_enabled: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
          whatsapp_notifications_enabled?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
          whatsapp_notifications_enabled?: boolean | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          days_before: number | null
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          message: string | null
          next_send_at: string | null
          reference_id: string | null
          reminder_type: string
          time_of_day: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          message?: string | null
          next_send_at?: string | null
          reference_id?: string | null
          reminder_type?: string
          time_of_day?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          message?: string | null
          next_send_at?: string | null
          reference_id?: string | null
          reminder_type?: string
          time_of_day?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_purchased: boolean | null
          name: string
          order_index: number | null
          quantity: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          name: string
          order_index?: number | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          name?: string
          order_index?: number | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_alerts_config: {
        Row: {
          alert_type: string
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          threshold: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          threshold?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          threshold?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_indicators_logs: {
        Row: {
          generated_at: string
          id: string
          indicator_type: string
          status: string
          user_id: string
          value: number
        }
        Insert: {
          generated_at?: string
          id?: string
          indicator_type: string
          status?: string
          user_id: string
          value?: number
        }
        Update: {
          generated_at?: string
          id?: string
          indicator_type?: string
          status?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      split_rules: {
        Row: {
          business_percentage: number
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          personal_percentage: number
          reserve_percentage: number
          user_id: string
        }
        Insert: {
          business_percentage?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          personal_percentage?: number
          reserve_percentage?: number
          user_id: string
        }
        Update: {
          business_percentage?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          personal_percentage?: number
          reserve_percentage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          location: string | null
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"]
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_id: string | null
          business_amount: number | null
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          income_type: string | null
          is_essential: boolean | null
          personal_amount: number | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          reserve_amount: number | null
          split_applied: boolean | null
          tags: string[] | null
          transaction_time: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_id?: string | null
          business_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          income_type?: string | null
          is_essential?: boolean | null
          personal_amount?: number | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          reserve_amount?: number | null
          split_applied?: boolean | null
          tags?: string[] | null
          transaction_time?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_id?: string | null
          business_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          income_type?: string | null
          is_essential?: boolean | null
          personal_amount?: number | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          reserve_amount?: number | null
          split_applied?: boolean | null
          tags?: string[] | null
          transaction_time?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balance: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          api_key: string | null
          api_url: string | null
          connected_at: string | null
          created_at: string
          id: string
          instance_name: string | null
          is_connected: boolean | null
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          phone_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_content: string
          message_type: string
          reminder_id: string | null
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_content: string
          message_type: string
          reminder_id?: string | null
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_content?: string
          message_type?: string
          reminder_id?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_log_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plan: {
        Args: { p_user_id: string }
        Returns: {
          advanced_dashboard_enabled: boolean
          annual_projection_enabled: boolean
          business_profile_enabled: boolean
          cashflow_projection_enabled: boolean
          export_enabled: boolean
          history_months: number
          is_active: boolean
          max_banks: number
          max_goals: number
          max_reminders: number
          monthly_planning_enabled: boolean
          plan_name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          reports_enabled: boolean
          split_enabled: boolean
          whatsapp_enabled: boolean
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_registration_allowed: { Args: never; Returns: boolean }
      update_app_setting: {
        Args: { p_allow_registration: boolean }
        Returns: {
          allow_registration: boolean
          created_at: string
          id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "app_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_has_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      billing_period: "monthly" | "yearly"
      plan_type: "free" | "pro" | "business" | "starter" | "pro_plus"
      profile_type: "personal" | "business"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "pending"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      billing_period: ["monthly", "yearly"],
      plan_type: ["free", "pro", "business", "starter", "pro_plus"],
      profile_type: ["personal", "business"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "pending",
      ],
    },
  },
} as const

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
      card_catalog: {
        Row: {
          base_value: number
          category: string
          description: string
          id: string
          name: string
          passive_income: number
          purchase_price: number
        }
        Insert: {
          base_value: number
          category: string
          description: string
          id: string
          name: string
          passive_income?: number
          purchase_price: number
        }
        Update: {
          base_value?: number
          category?: string
          description?: string
          id?: string
          name?: string
          passive_income?: number
          purchase_price?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          profile_id: string
          room_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          profile_id: string
          room_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          profile_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          failed_attempts: number
          locked_until: string | null
          pin_hash: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          failed_attempts?: number
          locked_until?: string | null
          pin_hash: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          failed_attempts?: number
          locked_until?: string | null
          pin_hash?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          assets: Json
          cash: number
          debts: Json
          deck: Json
          deck_cursor: number
          game_id: string
          hand: Json
          income_summary: Json
          net_worth: number
          passive_income: number
          personal_event: Json
          profile_id: string
          ready: boolean
          salary: number
          seat: number
          updated_at: string
        }
        Insert: {
          assets?: Json
          cash?: number
          debts?: Json
          deck?: Json
          deck_cursor?: number
          game_id: string
          hand?: Json
          income_summary?: Json
          net_worth?: number
          passive_income?: number
          personal_event?: Json
          profile_id: string
          ready?: boolean
          salary?: number
          seat: number
          updated_at?: string
        }
        Update: {
          assets?: Json
          cash?: number
          debts?: Json
          deck?: Json
          deck_cursor?: number
          game_id?: string
          hand?: Json
          income_summary?: Json
          net_worth?: number
          passive_income?: number
          personal_event?: Json
          profile_id?: string
          ready?: boolean
          salary?: number
          seat?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          created_at: string
          net_worth: number
          profile_id: string
          room_id: string
          won: boolean
        }
        Insert: {
          created_at?: string
          net_worth: number
          profile_id: string
          room_id: string
          won: boolean
        }
        Update: {
          created_at?: string
          net_worth?: number
          profile_id?: string
          room_id?: string
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "game_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          age: number
          global_event: Json
          id: string
          last_roll: Json
          market: Json
          paused: boolean
          phase: number
          room_id: string
          round_no: number
          status: string
          updated_at: string
        }
        Insert: {
          age?: number
          global_event?: Json
          id?: string
          last_roll?: Json
          market?: Json
          paused?: boolean
          phase?: number
          room_id: string
          round_no?: number
          status?: string
          updated_at?: string
        }
        Update: {
          age?: number
          global_event?: Json
          id?: string
          last_roll?: Json
          market?: Json
          paused?: boolean
          phase?: number
          room_id?: string
          round_no?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_log: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          entry: Json
          game_id: string
          id: string
          kind: string
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          entry?: Json
          game_id: string
          id?: string
          kind: string
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          entry?: Json
          game_id?: string
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_log_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      global_event_catalog: {
        Row: {
          description: string
          effects: Json
          id: string
          name: string
          type: string
        }
        Insert: {
          description: string
          effects?: Json
          id: string
          name: string
          type: string
        }
        Update: {
          description?: string
          effects?: Json
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      personal_event_catalog: {
        Row: {
          amount: number | null
          description: string
          effect_kind: string
          id: string
          name: string
          pct: number | null
        }
        Insert: {
          amount?: number | null
          description: string
          effect_kind: string
          id: string
          name: string
          pct?: number | null
        }
        Update: {
          amount?: number | null
          description?: string
          effect_kind?: string
          id?: string
          name?: string
          pct?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_net_worth: number
          created_at: string
          games_played: number
          id: string
          username: string
          wins: number
        }
        Insert: {
          avatar_url?: string | null
          best_net_worth?: number
          created_at?: string
          games_played?: number
          id: string
          username: string
          wins?: number
        }
        Update: {
          avatar_url?: string | null
          best_net_worth?: number
          created_at?: string
          games_played?: number
          id?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      room_players: {
        Row: {
          connected: boolean
          id: string
          is_host: boolean
          is_ready: boolean
          is_spectator: boolean
          joined_at: string
          profile_id: string
          room_id: string
          seat: number | null
          token_color: string | null
        }
        Insert: {
          connected?: boolean
          id?: string
          is_host?: boolean
          is_ready?: boolean
          is_spectator?: boolean
          joined_at?: string
          profile_id: string
          room_id: string
          seat?: number | null
          token_color?: string | null
        }
        Update: {
          connected?: boolean
          id?: string
          is_host?: boolean
          is_ready?: boolean
          is_spectator?: boolean
          joined_at?: string
          profile_id?: string
          room_id?: string
          seat?: number | null
          token_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          host_id: string
          id: string
          is_public: boolean
          max_players: number
          name: string
          status: string
          updated_at: string
          win_condition: Json
        }
        Insert: {
          code: string
          created_at?: string
          host_id: string
          id?: string
          is_public?: boolean
          max_players: number
          name: string
          status?: string
          updated_at?: string
          win_condition: Json
        }
        Update: {
          code?: string
          created_at?: string
          host_id?: string
          id?: string
          is_public?: boolean
          max_players?: number
          name?: string
          status?: string
          updated_at?: string
          win_condition?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_room: {
        Args: {
          _is_public: boolean
          _max_players: number
          _name: string
          _win_condition: Json
        }
        Returns: {
          code: string
          created_at: string
          host_id: string
          id: string
          is_public: boolean
          max_players: number
          name: string
          status: string
          updated_at: string
          win_condition: Json
        }
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      game_borrow: {
        Args: { _amount: number; _game_id: string }
        Returns: undefined
      }
      game_buy_card: {
        Args: { _card_id: string; _game_id: string }
        Returns: undefined
      }
      game_repay: {
        Args: { _amount: number; _debt_id: string; _game_id: string }
        Returns: undefined
      }
      game_sell_asset: {
        Args: { _game_id: string; _instance_id: string }
        Returns: undefined
      }
      game_set_ready: {
        Args: { _game_id: string; _ready: boolean }
        Returns: undefined
      }
      game_host_adjust_player: {
        Args: {
          _asset_add?: Json
          _cash_delta?: number
          _debt_add?: Json
          _game_id: string
          _hand_add?: Json
          _reason?: string
          _target: string
        }
        Returns: undefined
      }
      game_host_advance: {
        Args: { _game_id: string }
        Returns: undefined
      }
      game_host_kick: {
        Args: { _game_id: string; _target: string }
        Returns: undefined
      }
      game_host_set_paused: {
        Args: { _game_id: string; _paused: boolean }
        Returns: undefined
      }
      game_start: {
        Args: { _room_id: string }
        Returns: {
          age: number
          global_event: Json
          id: string
          last_roll: Json
          market: Json
          paused: boolean
          phase: number
          room_id: string
          round_no: number
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "games"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      join_room: {
        Args: { _as_spectator?: boolean; _code?: string; _room_id?: string }
        Returns: {
          code: string
          created_at: string
          host_id: string
          id: string
          is_public: boolean
          max_players: number
          name: string
          status: string
          updated_at: string
          win_condition: Json
        }
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      kick_player: {
        Args: { _room_id: string; _target: string }
        Returns: undefined
      }
      leave_room: { Args: { _room_id: string }; Returns: undefined }
      transfer_host: {
        Args: { _room_id: string; _target: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

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
          pin_hash: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          pin_hash: string
          profile_id: string
          updated_at?: string
        }
        Update: {
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
      game_actions: {
        Row: {
          created_at: string
          game_id: string
          id: string
          payload: Json
          processed: boolean
          profile_id: string
          type: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          payload?: Json
          processed?: boolean
          profile_id: string
          type: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          payload?: Json
          processed?: boolean
          profile_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_actions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_log: {
        Row: {
          created_at: string
          entry: Json
          game_id: string
          id: string
          seq: number
        }
        Insert: {
          created_at?: string
          entry: Json
          game_id: string
          id?: string
          seq: number
        }
        Update: {
          created_at?: string
          entry?: Json
          game_id?: string
          id?: string
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_log_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          current_seat: number
          id: string
          market: Json
          room_id: string
          round: number
          state: Json
          turn: number
          updated_at: string
        }
        Insert: {
          current_seat?: number
          id?: string
          market?: Json
          room_id: string
          round?: number
          state: Json
          turn?: number
          updated_at?: string
        }
        Update: {
          current_seat?: number
          id?: string
          market?: Json
          room_id?: string
          round?: number
          state?: Json
          turn?: number
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
      finish_game: {
        Args: { _final_state: Json; _room_id: string }
        Returns: undefined
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
      start_game: {
        Args: { _initial_state: Json; _room_id: string }
        Returns: {
          current_seat: number
          id: string
          market: Json
          room_id: string
          round: number
          state: Json
          turn: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "games"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_game_result: {
        Args: { _net_worth: number; _room_id: string; _won: boolean }
        Returns: undefined
      }
      sync_game_state: {
        Args: {
          _current_seat: number
          _market: Json
          _room_id: string
          _round: number
          _state: Json
          _turn: number
        }
        Returns: undefined
      }
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

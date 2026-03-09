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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          duration_ms: number | null
          id: string
          model_used: string | null
          role: string
          thinking_content: string | null
          tokens_input: number | null
          tokens_output: number | null
          tool_calls: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          model_used?: string | null
          role: string
          thinking_content?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tool_calls?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          model_used?: string | null
          role?: string
          thinking_content?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_items: {
        Row: {
          document_name: string
          id: string
          is_received: boolean
          module: string | null
          order_index: number | null
          priority: string
          project_id: string
          purpose: string | null
        }
        Insert: {
          document_name: string
          id?: string
          is_received?: boolean
          module?: string | null
          order_index?: number | null
          priority: string
          project_id: string
          purpose?: string | null
        }
        Update: {
          document_name?: string
          id?: string
          is_received?: boolean
          module?: string | null
          order_index?: number | null
          priority?: string
          project_id?: string
          purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_room_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          project_id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_embeddings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      interrogatory_items: {
        Row: {
          id: string
          module: string | null
          order_index: number | null
          priority: string
          project_id: string
          question: string
          question_id: string | null
          rationale: string | null
          status: string
        }
        Insert: {
          id?: string
          module?: string | null
          order_index?: number | null
          priority: string
          project_id: string
          question: string
          question_id?: string | null
          rationale?: string | null
          status?: string
        }
        Update: {
          id?: string
          module?: string | null
          order_index?: number | null
          priority?: string
          project_id?: string
          question?: string
          question_id?: string | null
          rationale?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "interrogatory_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          asset_class: string | null
          composite_score: number | null
          created_at: string
          error_message: string | null
          established_year: string | null
          fund_name: string
          id: string
          module_scores: Json | null
          recommendation: string | null
          score_tier: string | null
          status: string
          submitter_company: string | null
          submitter_email: string | null
          submitter_name: string | null
          updated_at: string
          vintage: string | null
        }
        Insert: {
          asset_class?: string | null
          composite_score?: number | null
          created_at?: string
          error_message?: string | null
          established_year?: string | null
          fund_name: string
          id?: string
          module_scores?: Json | null
          recommendation?: string | null
          score_tier?: string | null
          status?: string
          submitter_company?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
          vintage?: string | null
        }
        Update: {
          asset_class?: string | null
          composite_score?: number | null
          created_at?: string
          error_message?: string | null
          established_year?: string | null
          fund_name?: string
          id?: string
          module_scores?: Json | null
          recommendation?: string | null
          score_tier?: string | null
          status?: string
          submitter_company?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
          vintage?: string | null
        }
        Relationships: []
      }
      red_flags: {
        Row: {
          confidence: string | null
          data_room_action: string | null
          description: string | null
          id: string
          interrogatory_question: string | null
          logged_at: string
          module: string | null
          project_id: string
          severity: string
          title: string
        }
        Insert: {
          confidence?: string | null
          data_room_action?: string | null
          description?: string | null
          id?: string
          interrogatory_question?: string | null
          logged_at?: string
          module?: string | null
          project_id: string
          severity: string
          title: string
        }
        Update: {
          confidence?: string | null
          data_room_action?: string | null
          description?: string | null
          id?: string
          interrogatory_question?: string | null
          logged_at?: string
          module?: string | null
          project_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_flags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          confidence: string | null
          content: string | null
          created_at: string
          id: string
          order_index: number | null
          project_id: string
          score: number | null
          section_key: string
          section_title: string | null
        }
        Insert: {
          confidence?: string | null
          content?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          project_id: string
          score?: number | null
          section_key: string
          section_title?: string | null
        }
        Update: {
          confidence?: string | null
          content?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          project_id?: string
          score?: number | null
          section_key?: string
          section_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_sources: {
        Row: {
          added_at: string
          description: string | null
          favicon_url: string | null
          id: string
          project_id: string
          source_type: string | null
          title: string
          url: string
        }
        Insert: {
          added_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          project_id: string
          source_type?: string | null
          title: string
          url: string
        }
        Update: {
          added_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          project_id?: string
          source_type?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          project_id: string
          started_at: string | null
          status: string
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          project_id: string
          started_at?: string | null
          status?: string
          task_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          project_id?: string
          started_at?: string | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

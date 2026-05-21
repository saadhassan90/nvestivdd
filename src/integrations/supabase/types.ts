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
      analysis_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          detail: string | null
          id: string
          project_id: string
          started_at: string | null
          status: string
          step_index: number
          step_key: string
          step_label: string
          total_steps: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          project_id: string
          started_at?: string | null
          status?: string
          step_index?: number
          step_key: string
          step_label: string
          total_steps?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          project_id?: string
          started_at?: string | null
          status?: string
          step_index?: number
          step_key?: string
          step_label?: string
          total_steps?: number
        }
        Relationships: [
          {
            foreignKeyName: "analysis_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          asset_class: string
          created_at: string
          id: string
          is_stale: boolean
          market_segment: string
          refreshed_at: string
          sector_dynamics: Json | null
          sources: Json | null
          sub_asset_class: string
          term_standards: Json | null
          version: string
          vintage_performance: Json | null
          vintage_range: string | null
        }
        Insert: {
          asset_class: string
          created_at?: string
          id?: string
          is_stale?: boolean
          market_segment?: string
          refreshed_at?: string
          sector_dynamics?: Json | null
          sources?: Json | null
          sub_asset_class: string
          term_standards?: Json | null
          version?: string
          vintage_performance?: Json | null
          vintage_range?: string | null
        }
        Update: {
          asset_class?: string
          created_at?: string
          id?: string
          is_stale?: boolean
          market_segment?: string
          refreshed_at?: string
          sector_dynamics?: Json | null
          sources?: Json | null
          sub_asset_class?: string
          term_standards?: Json | null
          version?: string
          vintage_performance?: Json | null
          vintage_range?: string | null
        }
        Relationships: []
      }
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
      comments: {
        Row: {
          author_name: string
          author_type: string
          body_md: string
          created_at: string
          id: string
          parent_comment_id: string | null
          project_id: string
          report_version: number
          resolved_at: string | null
          section_id: string
          severity: string | null
          sub_card_id: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string
          author_type?: string
          body_md: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          project_id: string
          report_version?: number
          resolved_at?: string | null
          section_id: string
          severity?: string | null
          sub_card_id?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_type?: string
          body_md?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          project_id?: string
          report_version?: number
          resolved_at?: string | null
          section_id?: string
          severity?: string | null
          sub_card_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_landscape: {
        Row: {
          aum: string | null
          citation_ids: Json | null
          competitive_assessment: string | null
          competitor_name: string
          competitor_type: string
          differentiation_vs_fund: string | null
          id: string
          order_index: number | null
          project_id: string
          strategy_description: string | null
        }
        Insert: {
          aum?: string | null
          citation_ids?: Json | null
          competitive_assessment?: string | null
          competitor_name: string
          competitor_type: string
          differentiation_vs_fund?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          strategy_description?: string | null
        }
        Update: {
          aum?: string | null
          citation_ids?: Json | null
          competitive_assessment?: string | null
          competitor_name?: string
          competitor_type?: string
          differentiation_vs_fund?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          strategy_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_landscape_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      critical_info_gaps: {
        Row: {
          gap_description: string
          gap_title: string
          id: string
          order_index: number | null
          project_id: string
          related_module: string | null
          severity: string
        }
        Insert: {
          gap_description: string
          gap_title: string
          id?: string
          order_index?: number | null
          project_id: string
          related_module?: string | null
          severity: string
        }
        Update: {
          gap_description?: string
          gap_title?: string
          id?: string
          order_index?: number | null
          project_id?: string
          related_module?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "critical_info_gaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_items: {
        Row: {
          document_name: string
          id: string
          is_received: boolean
          is_reviewed: boolean
          module: string | null
          order_index: number | null
          priority: string
          priority_label: string | null
          priority_tier: number | null
          project_id: string
          purpose: string | null
          received_date: string | null
          reviewer_notes: string | null
          source_module: string | null
          sub_items: Json | null
        }
        Insert: {
          document_name: string
          id?: string
          is_received?: boolean
          is_reviewed?: boolean
          module?: string | null
          order_index?: number | null
          priority: string
          priority_label?: string | null
          priority_tier?: number | null
          project_id: string
          purpose?: string | null
          received_date?: string | null
          reviewer_notes?: string | null
          source_module?: string | null
          sub_items?: Json | null
        }
        Update: {
          document_name?: string
          id?: string
          is_received?: boolean
          is_reviewed?: boolean
          module?: string | null
          order_index?: number | null
          priority?: string
          priority_label?: string | null
          priority_tier?: number | null
          project_id?: string
          purpose?: string | null
          received_date?: string | null
          reviewer_notes?: string | null
          source_module?: string | null
          sub_items?: Json | null
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
      document_quality_flags: {
        Row: {
          assessment: string
          flag_key: string
          flag_label: string
          id: string
          project_id: string
          rating: string
        }
        Insert: {
          assessment: string
          flag_key: string
          flag_label: string
          id?: string
          project_id: string
          rating: string
        }
        Update: {
          assessment?: string
          flag_key?: string
          flag_label?: string
          id?: string
          project_id?: string
          rating?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_quality_flags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classification_confidence: string | null
          document_date: string | null
          document_type_classified: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          page_count: number | null
          project_id: string
          quality_notes: string | null
          uploaded_at: string
        }
        Insert: {
          classification_confidence?: string | null
          document_date?: string | null
          document_type_classified?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          page_count?: number | null
          project_id: string
          quality_notes?: string | null
          uploaded_at?: string
        }
        Update: {
          classification_confidence?: string | null
          document_date?: string | null
          document_type_classified?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          page_count?: number | null
          project_id?: string
          quality_notes?: string | null
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
      engagement_case_studies: {
        Row: {
          assessment_detail: string | null
          assessment_rating: string | null
          company_name: string
          engagement_outcomes: Json | null
          id: string
          investment_thesis: string | null
          market_validation: string | null
          order_index: number | null
          outcome_status: string | null
          project_id: string
          sector: string | null
        }
        Insert: {
          assessment_detail?: string | null
          assessment_rating?: string | null
          company_name: string
          engagement_outcomes?: Json | null
          id?: string
          investment_thesis?: string | null
          market_validation?: string | null
          order_index?: number | null
          outcome_status?: string | null
          project_id: string
          sector?: string | null
        }
        Update: {
          assessment_detail?: string | null
          assessment_rating?: string | null
          company_name?: string
          engagement_outcomes?: Json | null
          id?: string
          investment_thesis?: string | null
          market_validation?: string | null
          order_index?: number | null
          outcome_status?: string | null
          project_id?: string
          sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_case_studies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure: {
        Row: {
          assessment: string | null
          assessment_detail: string | null
          asset_class_norm: string | null
          component: string
          id: string
          is_disclosed: boolean
          order_index: number | null
          project_id: string
          share_class: string
          value: string
        }
        Insert: {
          assessment?: string | null
          assessment_detail?: string | null
          asset_class_norm?: string | null
          component: string
          id?: string
          is_disclosed?: boolean
          order_index?: number | null
          project_id: string
          share_class: string
          value: string
        }
        Update: {
          assessment?: string | null
          assessment_detail?: string | null
          asset_class_norm?: string | null
          component?: string
          id?: string
          is_disclosed?: boolean
          order_index?: number | null
          project_id?: string
          share_class?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structure_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hard_floor_evaluations: {
        Row: {
          created_at: string
          evidence_text: string | null
          floor_id: string
          id: string
          override_at: string | null
          override_author: string | null
          override_reason: string | null
          override_state: string
          project_id: string
          source_refs: Json | null
          status: string
          triggered_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_text?: string | null
          floor_id: string
          id?: string
          override_at?: string | null
          override_author?: string | null
          override_reason?: string | null
          override_state?: string
          project_id: string
          source_refs?: Json | null
          status?: string
          triggered_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_text?: string | null
          floor_id?: string
          id?: string
          override_at?: string | null
          override_author?: string | null
          override_reason?: string | null
          override_state?: string
          project_id?: string
          source_refs?: Json | null
          status?: string
          triggered_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hard_floor_evaluations_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "hard_floors"
            referencedColumns: ["floor_id"]
          },
        ]
      }
      hard_floors: {
        Row: {
          active: boolean
          asset_class: string
          created_at: string
          display_order: number
          floor_id: string
          title: string
          trigger_description: string
        }
        Insert: {
          active?: boolean
          asset_class?: string
          created_at?: string
          display_order: number
          floor_id: string
          title: string
          trigger_description: string
        }
        Update: {
          active?: boolean
          asset_class?: string
          created_at?: string
          display_order?: number
          floor_id?: string
          title?: string
          trigger_description?: string
        }
        Relationships: []
      }
      ic_memos: {
        Row: {
          content_json: Json
          content_markdown: string
          created_at: string
          id: string
          project_id: string
          updated_at: string
          version: number
        }
        Insert: {
          content_json?: Json
          content_markdown?: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          content_json?: Json
          content_markdown?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      interrogatory_items: {
        Row: {
          gp_response_notes: string | null
          gp_response_score: number | null
          id: string
          module: string | null
          order_index: number | null
          priority: string
          project_id: string
          question: string
          question_id: string | null
          rationale: string | null
          related_red_flag_ids: Json | null
          source_module: string | null
          source_module_label: string | null
          status: string
        }
        Insert: {
          gp_response_notes?: string | null
          gp_response_score?: number | null
          id?: string
          module?: string | null
          order_index?: number | null
          priority: string
          project_id: string
          question: string
          question_id?: string | null
          rationale?: string | null
          related_red_flag_ids?: Json | null
          source_module?: string | null
          source_module_label?: string | null
          status?: string
        }
        Update: {
          gp_response_notes?: string | null
          gp_response_score?: number | null
          id?: string
          module?: string | null
          order_index?: number | null
          priority?: string
          project_id?: string
          question?: string
          question_id?: string | null
          rationale?: string | null
          related_red_flag_ids?: Json | null
          source_module?: string | null
          source_module_label?: string | null
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
      knowledge_edges: {
        Row: {
          created_at: string | null
          id: string
          properties: Json | null
          relationship_type: string
          source_node_id: string
          target_node_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          properties?: Json | null
          relationship_type: string
          source_node_id: string
          target_node_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          properties?: Json | null
          relationship_type?: string
          source_node_id?: string
          target_node_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_nodes: {
        Row: {
          created_at: string | null
          depth_level: number | null
          embedding: string | null
          id: string
          label: string
          node_type: string
          parent_node_id: string | null
          project_id: string | null
          properties: Json | null
          source_id: string | null
          source_table: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          depth_level?: number | null
          embedding?: string | null
          id?: string
          label: string
          node_type: string
          parent_node_id?: string | null
          project_id?: string | null
          properties?: Json | null
          source_id?: string | null
          source_table?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          depth_level?: number | null
          embedding?: string | null
          id?: string
          label?: string
          node_type?: string
          parent_node_id?: string | null
          project_id?: string | null
          properties?: Json | null
          source_id?: string | null
          source_table?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      market_factors: {
        Row: {
          citation_ids: Json | null
          confidence: string
          description: string
          factor_type: string
          id: string
          order_index: number | null
          project_id: string
          supporting_data: string | null
          time_horizon: string | null
          title: string
        }
        Insert: {
          citation_ids?: Json | null
          confidence: string
          description: string
          factor_type: string
          id?: string
          order_index?: number | null
          project_id: string
          supporting_data?: string | null
          time_horizon?: string | null
          title: string
        }
        Update: {
          citation_ids?: Json | null
          confidence?: string
          description?: string
          factor_type?: string
          id?: string
          order_index?: number | null
          project_id?: string
          supporting_data?: string | null
          time_horizon?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_factors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      module_scores: {
        Row: {
          confidence: string | null
          confidence_rationale: string | null
          id: string
          module_key: string
          module_label: string
          order_index: number | null
          project_id: string
          score: number
          sub_scores: Json | null
          summary_assessment: string | null
          takeaways: Json | null
          tier_label: string | null
          weight: number | null
          weighted_score: number | null
        }
        Insert: {
          confidence?: string | null
          confidence_rationale?: string | null
          id?: string
          module_key: string
          module_label: string
          order_index?: number | null
          project_id: string
          score?: number
          sub_scores?: Json | null
          summary_assessment?: string | null
          takeaways?: Json | null
          tier_label?: string | null
          weight?: number | null
          weighted_score?: number | null
        }
        Update: {
          confidence?: string | null
          confidence_rationale?: string | null
          id?: string
          module_key?: string
          module_label?: string
          order_index?: number | null
          project_id?: string
          score?: number
          sub_scores?: Json | null
          summary_assessment?: string | null
          takeaways?: Json | null
          tier_label?: string | null
          weight?: number | null
          weighted_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "module_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      odd_reports: {
        Row: {
          content_json: Json
          content_markdown: string
          created_at: string
          id: string
          project_id: string
          risk_rating: string | null
          updated_at: string
          version: number
        }
        Insert: {
          content_json?: Json
          content_markdown?: string
          created_at?: string
          id?: string
          project_id: string
          risk_rating?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          content_json?: Json
          content_markdown?: string
          created_at?: string
          id?: string
          project_id?: string
          risk_rating?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      odd_section_results: {
        Row: {
          content_markdown: string | null
          created_at: string
          error_message: string | null
          flag_count: number
          id: string
          project_id: string
          section_key: string
          status: string
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          content_markdown?: string | null
          created_at?: string
          error_message?: string | null
          flag_count?: number
          id?: string
          project_id: string
          section_key: string
          status?: string
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          content_markdown?: string | null
          created_at?: string
          error_message?: string | null
          flag_count?: number
          id?: string
          project_id?: string
          section_key?: string
          status?: string
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          alpha: string | null
          as_of_date: string | null
          benchmark_name: string | null
          benchmark_value: string | null
          benchmark_value_numeric: number | null
          citation_ids: Json | null
          fund_name: string
          id: string
          metric_category: string
          metric_name: string
          order_index: number | null
          project_id: string
          value: string
          value_numeric: number | null
        }
        Insert: {
          alpha?: string | null
          as_of_date?: string | null
          benchmark_name?: string | null
          benchmark_value?: string | null
          benchmark_value_numeric?: number | null
          citation_ids?: Json | null
          fund_name: string
          id?: string
          metric_category: string
          metric_name: string
          order_index?: number | null
          project_id: string
          value: string
          value_numeric?: number | null
        }
        Update: {
          alpha?: string | null
          as_of_date?: string | null
          benchmark_name?: string | null
          benchmark_value?: string | null
          benchmark_value_numeric?: number | null
          citation_ids?: Json | null
          fund_name?: string
          id?: string
          metric_category?: string
          metric_name?: string
          order_index?: number | null
          project_id?: string
          value?: string
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_cache: {
        Row: {
          char_count: number
          created_at: string
          id: string
          model_used: string | null
          output_text: string
          phase_key: string
          project_id: string
        }
        Insert: {
          char_count?: number
          created_at?: string
          id?: string
          model_used?: string | null
          output_text: string
          phase_key: string
          project_id: string
        }
        Update: {
          char_count?: number
          created_at?: string
          id?: string
          model_used?: string | null
          output_text?: string
          phase_key?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          analysis_date: string | null
          asset_class: string | null
          completeness_pct: number | null
          completeness_score: number | null
          composite_score: number | null
          conditions_for_advancement: Json | null
          confidence_reason: string | null
          confidence_tier: string | null
          created_at: string
          document_type: string | null
          domicile: string | null
          error_message: string | null
          esg_claims: Json | null
          esg_process_matrix: Json | null
          esg_score: number | null
          established_year: string | null
          executive_summary_narrative: string | null
          final_assessment_narrative: string | null
          fund_inception_date: string | null
          fund_name: string
          fund_size_estimated: string | null
          geography_breakdown: Json | null
          gp_entity_name: string | null
          id: string
          impact_focus: string | null
          key_risks: Json | null
          key_strengths: Json | null
          market_context: Json | null
          market_validation_points: Json | null
          module_scores: Json | null
          recommendation: string | null
          recommendation_v2: string | null
          recommended_timeline: string | null
          regulatory_status: string | null
          report_markdown: string | null
          score_tier: string | null
          score_tier_v2: string | null
          sector_breakdown: Json | null
          sfdr_classification: string | null
          status: string
          strategy: string | null
          submitter_company: string | null
          submitter_email: string | null
          submitter_name: string | null
          updated_at: string
          vintage: string | null
        }
        Insert: {
          analysis_date?: string | null
          asset_class?: string | null
          completeness_pct?: number | null
          completeness_score?: number | null
          composite_score?: number | null
          conditions_for_advancement?: Json | null
          confidence_reason?: string | null
          confidence_tier?: string | null
          created_at?: string
          document_type?: string | null
          domicile?: string | null
          error_message?: string | null
          esg_claims?: Json | null
          esg_process_matrix?: Json | null
          esg_score?: number | null
          established_year?: string | null
          executive_summary_narrative?: string | null
          final_assessment_narrative?: string | null
          fund_inception_date?: string | null
          fund_name: string
          fund_size_estimated?: string | null
          geography_breakdown?: Json | null
          gp_entity_name?: string | null
          id?: string
          impact_focus?: string | null
          key_risks?: Json | null
          key_strengths?: Json | null
          market_context?: Json | null
          market_validation_points?: Json | null
          module_scores?: Json | null
          recommendation?: string | null
          recommendation_v2?: string | null
          recommended_timeline?: string | null
          regulatory_status?: string | null
          report_markdown?: string | null
          score_tier?: string | null
          score_tier_v2?: string | null
          sector_breakdown?: Json | null
          sfdr_classification?: string | null
          status?: string
          strategy?: string | null
          submitter_company?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
          vintage?: string | null
        }
        Update: {
          analysis_date?: string | null
          asset_class?: string | null
          completeness_pct?: number | null
          completeness_score?: number | null
          composite_score?: number | null
          conditions_for_advancement?: Json | null
          confidence_reason?: string | null
          confidence_tier?: string | null
          created_at?: string
          document_type?: string | null
          domicile?: string | null
          error_message?: string | null
          esg_claims?: Json | null
          esg_process_matrix?: Json | null
          esg_score?: number | null
          established_year?: string | null
          executive_summary_narrative?: string | null
          final_assessment_narrative?: string | null
          fund_inception_date?: string | null
          fund_name?: string
          fund_size_estimated?: string | null
          geography_breakdown?: Json | null
          gp_entity_name?: string | null
          id?: string
          impact_focus?: string | null
          key_risks?: Json | null
          key_strengths?: Json | null
          market_context?: Json | null
          market_validation_points?: Json | null
          module_scores?: Json | null
          recommendation?: string | null
          recommendation_v2?: string | null
          recommended_timeline?: string | null
          regulatory_status?: string | null
          report_markdown?: string | null
          score_tier?: string | null
          score_tier_v2?: string | null
          sector_breakdown?: Json | null
          sfdr_classification?: string | null
          status?: string
          strategy?: string | null
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
          flag_number: number | null
          id: string
          implication: string | null
          interrogatory_question: string | null
          issue: string | null
          logged_at: string
          module: string | null
          order_index: number | null
          project_id: string
          related_data_room_ids: Json | null
          related_interrogatory_ids: Json | null
          resolution: string | null
          severity: string
          source_module: string | null
          timeline: string | null
          title: string
        }
        Insert: {
          confidence?: string | null
          data_room_action?: string | null
          description?: string | null
          flag_number?: number | null
          id?: string
          implication?: string | null
          interrogatory_question?: string | null
          issue?: string | null
          logged_at?: string
          module?: string | null
          order_index?: number | null
          project_id: string
          related_data_room_ids?: Json | null
          related_interrogatory_ids?: Json | null
          resolution?: string | null
          severity: string
          source_module?: string | null
          timeline?: string | null
          title: string
        }
        Update: {
          confidence?: string | null
          data_room_action?: string | null
          description?: string | null
          flag_number?: number | null
          id?: string
          implication?: string | null
          interrogatory_question?: string | null
          issue?: string | null
          logged_at?: string
          module?: string | null
          order_index?: number | null
          project_id?: string
          related_data_room_ids?: Json | null
          related_interrogatory_ids?: Json | null
          resolution?: string | null
          severity?: string
          source_module?: string | null
          timeline?: string | null
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
          module_key: string | null
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
          module_key?: string | null
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
          module_key?: string | null
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
          accessed_date: string | null
          added_at: string
          citation_id: string | null
          description: string | null
          excerpt: string | null
          favicon_url: string | null
          id: string
          is_primary: boolean
          linked_sections: Json | null
          linked_team_member_names: Json | null
          project_id: string
          source_category: string | null
          source_type: string | null
          title: string
          url: string
        }
        Insert: {
          accessed_date?: string | null
          added_at?: string
          citation_id?: string | null
          description?: string | null
          excerpt?: string | null
          favicon_url?: string | null
          id?: string
          is_primary?: boolean
          linked_sections?: Json | null
          linked_team_member_names?: Json | null
          project_id: string
          source_category?: string | null
          source_type?: string | null
          title: string
          url: string
        }
        Update: {
          accessed_date?: string | null
          added_at?: string
          citation_id?: string | null
          description?: string | null
          excerpt?: string | null
          favicon_url?: string | null
          id?: string
          is_primary?: boolean
          linked_sections?: Json | null
          linked_team_member_names?: Json | null
          project_id?: string
          source_category?: string | null
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
      service_providers: {
        Row: {
          id: string
          importance: string
          is_disclosed: boolean
          is_verified: boolean | null
          notes: string | null
          project_id: string
          provider_name: string | null
          provider_type: string
          verification_detail: string | null
        }
        Insert: {
          id?: string
          importance?: string
          is_disclosed?: boolean
          is_verified?: boolean | null
          notes?: string | null
          project_id: string
          provider_name?: string | null
          provider_type: string
          verification_detail?: string | null
        }
        Update: {
          id?: string
          importance?: string
          is_disclosed?: boolean
          is_verified?: boolean | null
          notes?: string | null
          project_id?: string
          provider_name?: string | null
          provider_type?: string
          verification_detail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_quality: {
        Row: {
          category: string
          category_label: string
          confidence: string
          id: string
          order_index: number | null
          project_id: string
          severity: string
          status: string
        }
        Insert: {
          category: string
          category_label: string
          confidence: string
          id?: string
          order_index?: number | null
          project_id: string
          severity?: string
          status: string
        }
        Update: {
          category?: string
          category_label?: string
          confidence?: string
          id?: string
          order_index?: number | null
          project_id?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_quality_project_id_fkey"
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
          max_retries: number
          output_payload: Json | null
          project_id: string
          retry_count: number
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
          max_retries?: number
          output_payload?: Json | null
          project_id: string
          retry_count?: number
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
          max_retries?: number
          output_payload?: Json | null
          project_id?: string
          retry_count?: number
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
      team_members: {
        Row: {
          adverse_finding_severity: string | null
          adverse_findings: string | null
          assessment_rating: string | null
          education: string | null
          id: string
          is_key_person: boolean
          name: string
          order_index: number | null
          photo_url: string | null
          prior_affiliations: Json | null
          project_id: string
          role_category: string | null
          title: string | null
          verification_citation_ids: Json | null
          verification_detail: string | null
          verification_status: string
          years_experience: number | null
        }
        Insert: {
          adverse_finding_severity?: string | null
          adverse_findings?: string | null
          assessment_rating?: string | null
          education?: string | null
          id?: string
          is_key_person?: boolean
          name: string
          order_index?: number | null
          photo_url?: string | null
          prior_affiliations?: Json | null
          project_id: string
          role_category?: string | null
          title?: string | null
          verification_citation_ids?: Json | null
          verification_detail?: string | null
          verification_status?: string
          years_experience?: number | null
        }
        Update: {
          adverse_finding_severity?: string | null
          adverse_findings?: string | null
          assessment_rating?: string | null
          education?: string | null
          id?: string
          is_key_person?: boolean
          name?: string
          order_index?: number | null
          photo_url?: string | null
          prior_affiliations?: Json | null
          project_id?: string
          role_category?: string | null
          title?: string | null
          verification_citation_ids?: Json | null
          verification_detail?: string | null
          verification_status?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      thesis_validations: {
        Row: {
          benchmark_text: string | null
          citation_ids: Json | null
          claim: string
          claim_source: string | null
          confidence: string
          deviation_flag: string | null
          id: string
          order_index: number | null
          project_id: string
          validation_detail: string | null
          validation_status: string
        }
        Insert: {
          benchmark_text?: string | null
          citation_ids?: Json | null
          claim: string
          claim_source?: string | null
          confidence: string
          deviation_flag?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          validation_detail?: string | null
          validation_status: string
        }
        Update: {
          benchmark_text?: string | null
          citation_ids?: Json | null
          claim?: string
          claim_source?: string | null
          confidence?: string
          deviation_flag?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          validation_detail?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "thesis_validations_project_id_fkey"
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
      search_knowledge_graph: {
        Args: {
          filter_project_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          depth_level: number
          id: string
          label: string
          node_type: string
          parent_node_id: string
          project_id: string
          properties: Json
          similarity: number
          source_id: string
          source_table: string
          summary: string
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

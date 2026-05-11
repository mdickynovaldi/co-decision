export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "student" | "teacher" | "admin" | "super_admin";
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: "student" | "teacher" | "admin" | "super_admin";
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      classes: {
        Row: {
          id: string;
          name: string;
          code: string;
          teacher_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          name: string;
          code: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };
      issues: {
        Row: {
          id: string;
          group_code: "A" | "B" | "C" | "D" | "E";
          slug: string;
          title: string;
          description: string;
          content: string;
          thumbnail_tone: string;
          thumbnail_url: string | null;
          roblox_map_url: string;
          is_published: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["issues"]["Row"]> & {
          slug: string;
          title: string;
          description: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
      };
      groups: {
        Row: {
          id: string;
          class_id: string;
          code: "A" | "B" | "C" | "D" | "E";
          name: string;
          issue_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["groups"]["Row"]> & {
          class_id: string;
          code: "A" | "B" | "C" | "D" | "E";
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
      };
      stimulus_assets: {
        Row: {
          id: string;
          issue_id: string;
          type: "link" | "image" | "video" | "document";
          title: string;
          url: string;
          description: string | null;
          order_index: number;
          is_published: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["stimulus_assets"]["Row"]> & {
          issue_id: string;
          type: "link" | "image" | "video" | "document";
          title: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["stimulus_assets"]["Insert"]>;
      };
      reflection_questions: {
        Row: {
          id: string;
          issue_id: string | null;
          question_text: string;
          order_index: number;
          min_answer_length: number;
          is_required: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["reflection_questions"]["Row"]> & {
          question_text: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["reflection_questions"]["Insert"]>;
      };
      role_cards: {
        Row: {
          id: string;
          name: string;
          slug: string;
          avatar: string;
          avatar_url: string | null;
          short_description: string;
          mission: string;
          interest: string;
          alternatives: Json;
          decision_criteria: Json;
          checklist: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["role_cards"]["Row"]> & {
          name: string;
          slug: string;
          avatar: string;
          short_description: string;
          mission: string;
          interest: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_cards"]["Insert"]>;
      };
      student_sessions: {
        Row: {
          id: string;
          student_user_id: string;
          student_name: string;
          class_id: string | null;
          class_code: string | null;
          group_code: "A" | "B" | "C" | "D" | "E";
          issue_id: string | null;
          role_card_id: string | null;
          status: "registered" | "issue" | "stimulus" | "role" | "discussion" | "final" | "completed";
          progress_step: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["student_sessions"]["Row"]> & {
          student_user_id: string;
          student_name: string;
          group_code: "A" | "B" | "C" | "D" | "E";
        };
        Update: Partial<Database["public"]["Tables"]["student_sessions"]["Insert"]>;
      };
      reflection_answers: {
        Row: {
          id: string;
          student_session_id: string;
          question_id: string;
          answer_text: string;
          autosaved_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["reflection_answers"]["Row"]> & {
          student_session_id: string;
          question_id: string;
          answer_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["reflection_answers"]["Insert"]>;
      };
      roblox_map_clicks: {
        Row: {
          id: string;
          student_session_id: string;
          issue_id: string | null;
          role_card_id: string | null;
          roblox_map_url: string;
          user_agent: string | null;
          clicked_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roblox_map_clicks"]["Row"]> & {
          student_session_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["roblox_map_clicks"]["Insert"]>;
      };
      discussion_results: {
        Row: {
          id: string;
          student_session_id: string;
          observation_text: string;
          visible_problem_text: string;
          role_opinion_text: string;
          other_roles_opinion_text: string;
          group_solution_draft: string;
          agreed_roles_count: number;
          autosaved_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["discussion_results"]["Row"]> & {
          student_session_id: string;
          observation_text: string;
          visible_problem_text: string;
          role_opinion_text: string;
          group_solution_draft: string;
        };
        Update: Partial<Database["public"]["Tables"]["discussion_results"]["Insert"]>;
      };
      final_solutions: {
        Row: {
          id: string;
          student_session_id: string;
          final_solution_text: string;
          action_steps_text: string;
          personal_commitment_text: string;
          submitted_at: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["final_solutions"]["Row"]> & {
          student_session_id: string;
          final_solution_text: string;
          action_steps_text: string;
          personal_commitment_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["final_solutions"]["Insert"]>;
      };
      rubric_scores: {
        Row: {
          id: string;
          student_session_id: string;
          teacher_id: string;
          problem_understanding_score: number;
          role_alignment_score: number;
          discussion_quality_score: number;
          solution_quality_score: number;
          action_commitment_score: number;
          feedback_text: string;
          status: "draft" | "saved";
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["rubric_scores"]["Row"]> & {
          student_session_id: string;
          teacher_id: string;
          problem_understanding_score: number;
          role_alignment_score: number;
          discussion_quality_score: number;
          solution_quality_score: number;
          action_commitment_score: number;
        };
        Update: Partial<Database["public"]["Tables"]["rubric_scores"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          action: string;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      rate_limit_events: {
        Row: {
          id: string;
          key: string;
          action: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rate_limit_events"]["Row"]> & {
          key: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_events"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

import type { AppTheme } from "@/lib/theme";

export type Profile = {
  id: string;
  couple_id: string | null;
  display_name: string;
  created_at: string;
};

export type Couple = {
  id: string;
  invite_code: string;
  created_at: string;
  cover_path: string | null;
  theme: AppTheme | Record<string, string> | null;
};

export type Echo = {
  id: string;
  couple_id: string;
  created_by: string;
  kind: "song" | "phrase";
  title: string;
  body: string | null;
  why: string | null;
  image_url: string | null;
  spotify_url: string | null;
  created_at: string;
};

export type Place = {
  id: string;
  couple_id: string;
  created_by: string;
  name: string;
  note: string | null;
  lat: number;
  lng: number;
  visited_on: string | null;
  created_at: string;
};

export type DailyQuestion = {
  id: string;
  prompt: string;
  sort_order: number;
};

export type QuestionAnswer = {
  id: string;
  couple_id: string;
  user_id: string;
  question_id: string;
  for_date: string;
  answer: string;
  created_at: string;
};

export type Memory = {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  happened_on: string;
  note: string | null;
  photo_path: string | null;
  created_at: string;
};

export type DateIdea = {
  id: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  detail: string | null;
  drawn_at: string | null;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  note: string | null;
  happens_on: string;
  created_at: string;
};

export type CalendarHeart = {
  couple_id: string;
  happens_on: string;
  created_by: string;
  created_at: string;
};

export type Countdown = {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  target_at: string;
  emoji: string;
  created_at: string;
};

export type SavingsGoal = {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  target_amount: number | string;
  monthly_amount: number | string;
  created_at: string;
  updated_at: string;
};

export type SavingsEntry = {
  id: string;
  couple_id: string;
  goal_id: string;
  created_by: string;
  amount: number | string;
  for_month: string;
  note: string | null;
  created_at: string;
};

export type Dream = {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  note: string | null;
  done: boolean;
  completed_at: string | null;
  created_at: string;
};

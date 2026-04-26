import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface RoadmapWeek {
  week: number;
  focus: string;
  tasks: string[];
}

export interface RecommendedRole {
  role: string;
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  roadmap: RoadmapWeek[];
}

export const resumesTable = pgTable(
  "resumes",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    fileName: text("file_name").notNull(),
    rawText: text("raw_text").notNull().default(""),
    status: text("status").notNull().default("uploaded"),
    atsScore: integer("ats_score"),
    keywordScore: integer("keyword_score"),
    skillScore: integer("skill_score"),
    experienceScore: integer("experience_score"),
    extractedSkills: jsonb("extracted_skills")
      .$type<string[]>()
      .notNull()
      .default([]),
    missingKeywords: jsonb("missing_keywords")
      .$type<string[]>()
      .notNull()
      .default([]),
    weakAreas: jsonb("weak_areas").$type<string[]>().notNull().default([]),
    improvements: jsonb("improvements").$type<string[]>().notNull().default([]),
    improvedBullets: jsonb("improved_bullets")
      .$type<string[]>()
      .notNull()
      .default([]),
    recommendedRoles: jsonb("recommended_roles")
      .$type<RecommendedRole[]>()
      .notNull()
      .default([]),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("resumes_user_id_idx").on(table.userId),
  }),
);

export const insertResumeSchema = createInsertSchema(resumesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;

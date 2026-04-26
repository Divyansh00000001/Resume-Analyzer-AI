import { openai } from "./openai";
import { JOB_ROLES, type JobRoleDef } from "./jobRoles";
import type { RecommendedRole } from "@workspace/db";

export interface AiAnalysis {
  atsScore: number;
  keywordScore: number;
  skillScore: number;
  experienceScore: number;
  extractedSkills: string[];
  missingKeywords: string[];
  weakAreas: string[];
  improvements: string[];
  improvedBullets: string[];
  summary: string;
  topRoles: { slug: string; rationale: string }[];
}

const ANALYSIS_SYSTEM_PROMPT = `You are an experienced senior technical recruiter and resume coach. You give honest, kind, specific feedback. You never invent achievements; you only restructure what's already there.

You will receive raw resume text (extracted from a PDF, formatting may be lossy) and an optional target role. You will return STRICT JSON matching the requested schema. Your job:

- Score the resume's ATS-readiness (0-100). Be honest. Most resumes score 55-75; only truly excellent ones score 85+.
- Break the score into three sub-scores (each 0-100): keywordScore (industry/tool keywords present), skillScore (technical + soft skill coverage), experienceScore (impact, metrics, scope of work shown).
- Extract a clean deduplicated list of skills the candidate already has (12-25 items). Use canonical names ("JavaScript" not "javascript", "PostgreSQL" not "postgres").
- Identify missing keywords most often expected for the candidate's apparent target role(s) (8-15 items).
- Call out 3-6 specific weak areas in plain English. Example: "Bullets focus on responsibilities, not measurable impact." not "Improve bullets."
- Provide 4-7 concrete, actionable improvements the candidate can do this week.
- Rewrite 4-6 of the candidate's actual bullet points to be sharper, quantified, action-verb-led versions. Use the original content; do not fabricate metrics — if metrics aren't there, use [X%] or [N] placeholders the candidate can fill in.
- Write a 2-3 sentence honest narrative summary of the candidate.
- From this list of role slugs, choose the top 5 best fits for this candidate, ordered best to worst, with a one-sentence rationale each: %ROLE_SLUGS%

Return ONLY valid JSON, no markdown, no commentary.`;

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    atsScore: { type: "integer", minimum: 0, maximum: 100 },
    keywordScore: { type: "integer", minimum: 0, maximum: 100 },
    skillScore: { type: "integer", minimum: 0, maximum: 100 },
    experienceScore: { type: "integer", minimum: 0, maximum: 100 },
    extractedSkills: { type: "array", items: { type: "string" } },
    missingKeywords: { type: "array", items: { type: "string" } },
    weakAreas: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    improvedBullets: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    topRoles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string" },
          rationale: { type: "string" },
        },
        required: ["slug", "rationale"],
      },
    },
  },
  required: [
    "atsScore",
    "keywordScore",
    "skillScore",
    "experienceScore",
    "extractedSkills",
    "missingKeywords",
    "weakAreas",
    "improvements",
    "improvedBullets",
    "summary",
    "topRoles",
  ],
} as const;

export async function runAiAnalysis(
  rawText: string,
  targetRole: string | null,
): Promise<AiAnalysis> {
  const slugList = JOB_ROLES.map((r) => `${r.slug} (${r.title})`).join(", ");
  const system = ANALYSIS_SYSTEM_PROMPT.replace("%ROLE_SLUGS%", slugList);

  const userMsg = `TARGET ROLE: ${targetRole ?? "(not specified — infer from resume)"}\n\nRESUME TEXT:\n"""\n${rawText.slice(0, 18000)}\n"""`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMsg },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ResumeAnalysis",
        schema: ANALYSIS_SCHEMA,
        strict: true,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty response");
  }
  return JSON.parse(content) as AiAnalysis;
}

interface RoadmapPlan {
  roles: {
    slug: string;
    roadmap: { week: number; focus: string; tasks: string[] }[];
  }[];
}

const ROADMAP_SYSTEM = `You are a career coach. For each given role, write a focused 3-week skill-up roadmap that closes the candidate's specific missing skills. Each week has a clear focus theme and 3-5 concrete tasks (project ideas, courses, repos to read, things to build). Return STRICT JSON matching the schema. No markdown, no commentary.`;

const ROADMAP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    roles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string" },
          roadmap: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                week: { type: "integer" },
                focus: { type: "string" },
                tasks: { type: "array", items: { type: "string" } },
              },
              required: ["week", "focus", "tasks"],
            },
          },
        },
        required: ["slug", "roadmap"],
      },
    },
  },
  required: ["roles"],
} as const;

async function generateRoadmaps(
  candidateSummary: string,
  rolesWithGaps: { slug: string; title: string; missingSkills: string[] }[],
): Promise<RoadmapPlan> {
  const userMsg = `CANDIDATE: ${candidateSummary}\n\nROLES TO PLAN FOR:\n${rolesWithGaps
    .map(
      (r) =>
        `- ${r.slug} (${r.title}). Missing skills to focus on: ${r.missingSkills.join(", ") || "(no critical gaps — focus on portfolio polish)"}`,
    )
    .join("\n")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    messages: [
      { role: "system", content: ROADMAP_SYSTEM },
      { role: "user", content: userMsg },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "RoleRoadmaps",
        schema: ROADMAP_SCHEMA,
        strict: true,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned empty roadmap response");
  return JSON.parse(content) as RoadmapPlan;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");
}

function matchRole(
  role: JobRoleDef,
  candidateSkills: string[],
): { matchPercent: number; matchedSkills: string[]; missingSkills: string[] } {
  const candNorm = new Set(candidateSkills.map(normalize));
  const matchedCore = role.coreSkills.filter((s) => candNorm.has(normalize(s)));
  const matchedNice = role.niceToHaveSkills.filter((s) =>
    candNorm.has(normalize(s)),
  );
  const missingCore = role.coreSkills.filter(
    (s) => !candNorm.has(normalize(s)),
  );

  const coreScore = (matchedCore.length / role.coreSkills.length) * 80;
  const niceScore = (matchedNice.length / role.niceToHaveSkills.length) * 20;
  const matchPercent = Math.round(coreScore + niceScore);

  return {
    matchPercent,
    matchedSkills: [...matchedCore, ...matchedNice],
    missingSkills: missingCore,
  };
}

export async function buildRecommendedRoles(
  analysis: AiAnalysis,
): Promise<RecommendedRole[]> {
  const aiPicks = analysis.topRoles
    .map((p) => JOB_ROLES.find((r) => r.slug === p.slug))
    .filter((r): r is JobRoleDef => Boolean(r));

  const candidatePool: JobRoleDef[] =
    aiPicks.length > 0 ? aiPicks : JOB_ROLES.slice();

  const scored = candidatePool.map((role) => ({
    role,
    ...matchRole(role, analysis.extractedSkills),
  }));

  if (aiPicks.length === 0) {
    scored.sort((a, b) => b.matchPercent - a.matchPercent);
  }

  const top = scored.slice(0, 5);

  let roadmapPlan: RoadmapPlan | null = null;
  try {
    roadmapPlan = await generateRoadmaps(
      analysis.summary,
      top.map((s) => ({
        slug: s.role.slug,
        title: s.role.title,
        missingSkills: s.missingSkills,
      })),
    );
  } catch {
    roadmapPlan = null;
  }

  return top.map((s) => {
    const planned = roadmapPlan?.roles.find((r) => r.slug === s.role.slug);
    const fallbackRoadmap = [
      {
        week: 1,
        focus: `Foundations for ${s.role.title}`,
        tasks: s.missingSkills
          .slice(0, 3)
          .map((skill) => `Complete an introductory tutorial on ${skill}.`),
      },
      {
        week: 2,
        focus: "Build a portfolio project",
        tasks: [
          `Ship a small project that combines ${s.matchedSkills.slice(0, 2).join(" + ") || s.role.coreSkills[0]} with one new skill from your gap list.`,
          "Write a short README that frames the problem and your decisions.",
        ],
      },
      {
        week: 3,
        focus: "Interview prep and outreach",
        tasks: [
          `Practice 5 ${s.role.title} interview questions out loud.`,
          "Update your resume bullets using the rewrites above and reach out to 3 people in the role.",
        ],
      },
    ];
    return {
      role: s.role.title,
      matchPercent: s.matchPercent,
      matchedSkills: s.matchedSkills,
      missingSkills: s.missingSkills,
      roadmap:
        planned && planned.roadmap.length > 0 ? planned.roadmap : fallbackRoadmap,
    };
  });
}

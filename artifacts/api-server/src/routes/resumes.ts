import { Router, type IRouter } from "express";
import { db, resumesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  UploadResumeBody,
  AnalyzeResumeBody,
  GetResumeParams,
  DeleteResumeParams,
  AnalyzeResumeParams,
} from "@workspace/api-zod";
import { requireAuth, authed } from "../lib/auth";
import { extractPdfText } from "../lib/pdf";
import { runAiAnalysis, buildRecommendedRoles } from "../lib/analyze";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { userId } = authed(req);
  const rows = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .orderBy(desc(resumesTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      atsScore: r.atsScore,
      topRole: r.recommendedRoles[0]?.role ?? null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/", async (req, res) => {
  const { userId } = authed(req);
  const parsed = UploadResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const { fileName, fileBase64 } = parsed.data;
  const cleaned = fileBase64.replace(/^data:application\/pdf;base64,/, "");

  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleaned, "base64");
  } catch {
    res.status(400).json({ error: "Invalid base64" });
    return;
  }

  let text = "";
  try {
    text = await extractPdfText(buffer);
  } catch (err) {
    logger.error({ err }, "PDF parse failed");
    res.status(400).json({ error: "Could not parse PDF" });
    return;
  }

  if (!text || text.length < 30) {
    res.status(400).json({
      error:
        "We couldn't extract any text from this PDF. If your resume is an image-only scan, please export a text-based PDF and try again.",
    });
    return;
  }

  const [inserted] = await db
    .insert(resumesTable)
    .values({
      userId,
      fileName,
      rawText: text,
      status: "uploaded",
    })
    .returning();

  res.status(201).json(serializeResume(inserted));
});

router.get("/:id", async (req, res) => {
  const { userId } = authed(req);
  const params = GetResumeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, userId)));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeResume(row));
});

router.delete("/:id", async (req, res) => {
  const { userId } = authed(req);
  const params = DeleteResumeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, userId)));
  res.status(204).end();
});

router.post("/:id/analyze", async (req, res) => {
  const { userId } = authed(req);
  const params = AnalyzeResumeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = AnalyzeResumeBody.safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const targetRole = body.data.targetRole ?? null;

  const [row] = await db
    .select()
    .from(resumesTable)
    .where(and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, userId)));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .update(resumesTable)
    .set({ status: "analyzing" })
    .where(eq(resumesTable.id, row.id));

  try {
    const analysis = await runAiAnalysis(row.rawText, targetRole);
    const recommendedRoles = await buildRecommendedRoles(analysis);

    const [updated] = await db
      .update(resumesTable)
      .set({
        status: "analyzed",
        atsScore: analysis.atsScore,
        keywordScore: analysis.keywordScore,
        skillScore: analysis.skillScore,
        experienceScore: analysis.experienceScore,
        extractedSkills: analysis.extractedSkills,
        missingKeywords: analysis.missingKeywords,
        weakAreas: analysis.weakAreas,
        improvements: analysis.improvements,
        improvedBullets: analysis.improvedBullets,
        recommendedRoles,
        summary: analysis.summary,
      })
      .where(eq(resumesTable.id, row.id))
      .returning();

    res.json(serializeResume(updated));
  } catch (err) {
    logger.error({ err }, "Resume analysis failed");
    await db
      .update(resumesTable)
      .set({ status: "failed" })
      .where(eq(resumesTable.id, row.id));
    res.status(500).json({
      error:
        "Analysis failed. This usually means the AI service was unreachable. Please try again in a moment.",
    });
  }
});

function serializeResume(r: typeof resumesTable.$inferSelect) {
  return {
    id: r.id,
    fileName: r.fileName,
    rawText: r.rawText,
    status: r.status,
    atsScore: r.atsScore,
    keywordScore: r.keywordScore,
    skillScore: r.skillScore,
    experienceScore: r.experienceScore,
    extractedSkills: r.extractedSkills,
    missingKeywords: r.missingKeywords,
    weakAreas: r.weakAreas,
    improvements: r.improvements,
    improvedBullets: r.improvedBullets,
    recommendedRoles: r.recommendedRoles,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export default router;

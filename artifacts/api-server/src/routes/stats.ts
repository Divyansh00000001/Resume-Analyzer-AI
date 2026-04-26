import { Router, type IRouter } from "express";
import { db, resumesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, authed } from "../lib/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/summary", async (req, res) => {
  const { userId } = authed(req);
  const rows = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .orderBy(desc(resumesTable.createdAt));

  const analyzed = rows.filter(
    (r) => r.status === "analyzed" && r.atsScore !== null,
  );

  const averageAtsScore =
    analyzed.length > 0
      ? Math.round(
          (analyzed.reduce((s, r) => s + (r.atsScore ?? 0), 0) /
            analyzed.length) *
            10,
        ) / 10
      : null;

  const bestAtsScore =
    analyzed.length > 0
      ? Math.max(...analyzed.map((r) => r.atsScore ?? 0))
      : null;

  const roleAggregates = new Map<
    string,
    { totalMatch: number; appearances: number }
  >();
  for (const r of analyzed) {
    for (const rr of r.recommendedRoles) {
      const cur = roleAggregates.get(rr.role) ?? {
        totalMatch: 0,
        appearances: 0,
      };
      cur.totalMatch += rr.matchPercent;
      cur.appearances += 1;
      roleAggregates.set(rr.role, cur);
    }
  }

  const topRoleMatches = Array.from(roleAggregates.entries())
    .map(([role, v]) => ({
      role,
      averageMatch: Math.round((v.totalMatch / v.appearances) * 10) / 10,
      appearances: v.appearances,
    }))
    .sort((a, b) => b.averageMatch - a.averageMatch)
    .slice(0, 5);

  const recentActivity = rows.slice(0, 6).map((r) => ({
    id: r.id,
    fileName: r.fileName,
    atsScore: r.atsScore,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json({
    totalResumes: rows.length,
    analyzedResumes: analyzed.length,
    averageAtsScore,
    bestAtsScore,
    topRoleMatches,
    recentActivity,
  });
});

export default router;

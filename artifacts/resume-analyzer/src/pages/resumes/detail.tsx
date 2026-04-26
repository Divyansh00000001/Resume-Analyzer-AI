import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetResume, 
  useAnalyzeResume, 
  useDeleteResume,
  getGetResumeQueryKey,
  getListResumesQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  FileText, Loader2, AlertCircle, RefreshCw, Trash2, Copy, 
  CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp, Map, Target
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ResumeDetail() {
  const [, params] = useRoute("/resumes/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data: resume, isLoading, error } = useGetResume(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetResumeQueryKey(id),
      refetchInterval: (data: any) => (data?.state?.data?.status === "analyzing" ? 2500 : false),
    }
  });

  const analyzeMutation = useAnalyzeResume();
  const deleteMutation = useDeleteResume();

  const handleAnalyze = () => {
    analyzeMutation.mutate(
      { id, data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey(id) });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Resume deleted" });
          setLocation("/resumes");
        }
      }
    );
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container py-12 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Resume
            </CardTitle>
            <CardDescription>We couldn't load this resume. It may have been deleted.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/resumes")}>Back to Resumes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // STATUS: UPLOADED
  if (resume.status === "uploaded") {
    return (
      <div className="container py-12 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold">{resume.fileName}</h1>
        <p className="text-muted-foreground text-lg">Your resume is uploaded and ready for analysis.</p>
        
        <div className="pt-8">
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg w-full sm:w-auto"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...</>
            ) : (
              <><RefreshCw className="mr-2 h-5 w-5" /> Run Analysis</>
            )}
          </Button>
        </div>
        
        <div className="pt-12 border-t mt-12 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Resume
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the resume.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  // STATUS: ANALYZING
  if (resume.status === "analyzing") {
    return (
      <div className="container flex flex-col items-center justify-center py-24 px-4 h-[70vh]">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Analyzing Resume</h2>
        <p className="text-muted-foreground max-w-md text-center">
          Our AI is reading your resume, calculating your ATS score, and building a personalized action plan. This usually takes 10-20 seconds.
        </p>
      </div>
    );
  }

  // STATUS: FAILED
  if (resume.status === "failed") {
    return (
      <div className="container py-12 max-w-2xl mx-auto">
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Analysis Failed
            </CardTitle>
            <CardDescription className="text-base mt-2">
              We encountered an error while trying to read and analyze your PDF. The file might be corrupted, password-protected, or in an unreadable format.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-4">
            <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
              {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry Analysis"}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/upload")}>Upload Different File</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // STATUS: ANALYZED
  const scoreColor = resume.atsScore! >= 80 ? "hsl(142 71% 45%)" : resume.atsScore! >= 60 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)";
  
  const subScores = [
    { name: "Keywords", value: resume.keywordScore || 0, fill: "hsl(var(--chart-1))" },
    { name: "Skills", value: resume.skillScore || 0, fill: "hsl(var(--chart-2))" },
    { name: "Experience", value: resume.experienceScore || 0, fill: "hsl(var(--chart-3))" }
  ];

  return (
    <div className="container py-8 px-4 md:px-6 max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{resume.fileName}</h1>
          <p className="text-muted-foreground mt-1">Analysis complete</p>
        </div>
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                <AlertDialogDescription>This will permanently remove this resume and its analysis.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* HERO ATS SCORE */}
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-card to-accent/20 border-primary/20 shadow-md">
          <h3 className="text-lg font-medium text-muted-foreground mb-4">Overall ATS Score</h3>
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="70%" outerRadius="100%" 
                barSize={12} 
                data={[{ value: resume.atsScore }]} 
                startAngle={90} endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} fill={scoreColor} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tracking-tighter" style={{ color: scoreColor }}>
                {resume.atsScore}
              </span>
              <span className="text-sm font-medium text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className="mt-6 text-center text-sm font-medium">
            {resume.atsScore! >= 80 ? "Excellent! Your resume is highly optimized." : 
             resume.atsScore! >= 60 ? "Good, but needs some optimization." : 
             "Needs significant improvement to pass ATS filters."}
          </p>
        </Card>

        {/* SUMMARY & SUB SCORES */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed text-foreground/90">{resume.summary}</p>
            
            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Score Breakdown</h4>
              {subScores.map(score => (
                <div key={score.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{score.name}</span>
                    <span>{score.value}/100</span>
                  </div>
                  <Progress value={score.value} className="h-2" indicatorColor={score.fill} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* MISSING KEYWORDS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> 
              Missing Keywords
            </CardTitle>
            <CardDescription>Crucial words ATS systems look for but couldn't find.</CardDescription>
          </CardHeader>
          <CardContent>
            {resume.missingKeywords?.length ? (
              <div className="flex flex-wrap gap-2">
                {resume.missingKeywords.map(kw => (
                  <Badge key={kw} variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 px-3 py-1">
                    {kw}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-5 h-5" /> No major keywords missing!
              </div>
            )}
          </CardContent>
        </Card>

        {/* WEAK AREAS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" /> 
              Weak Areas
            </CardTitle>
            <CardDescription>Structural or content issues to fix.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {resume.weakAreas?.map((area, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-destructive font-bold mt-0.5">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* IMPROVEMENTS */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
          <CardTitle>Recommended Improvements</CardTitle>
          <CardDescription>Specific actions to elevate your resume.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {resume.improvements?.map((imp, i) => (
              <div key={i} className="p-4 sm:p-6 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-base pt-1">{imp}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI IMPROVED BULLETS */}
      {resume.improvedBullets && resume.improvedBullets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">AI-Improved Bullets</h2>
          <p className="text-muted-foreground">Replace your existing bullet points with these optimized versions.</p>
          <div className="grid gap-4">
            {resume.improvedBullets.map((bullet, i) => (
              <Card key={i} className="group">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <p className="text-sm leading-relaxed flex-1">{bullet}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(bullet, i)}
                  >
                    {copiedIndex === i ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TOP ROLE MATCHES */}
      {resume.recommendedRoles && resume.recommendedRoles.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" /> Top Role Matches
            </h2>
            <p className="text-muted-foreground mt-1">Based on your skills, these are your best career targets.</p>
          </div>

          <div className="grid gap-6">
            {resume.recommendedRoles.map((role, idx) => (
              <Card key={idx} className="overflow-hidden border-border/60">
                <div className="bg-accent/30 p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{role.role}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Match</span>
                    <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{role.matchPercent}%</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.matchedSkills.map(s => <Badge key={s} variant="secondary" className="bg-green-500/10 text-green-700">{s}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive" /> Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.missingSkills.map(s => <Badge key={s} variant="outline" className="border-destructive/30 text-destructive">{s}</Badge>)}
                      </div>
                    </div>
                  </div>

                  {role.roadmap && role.roadmap.length > 0 && (
                    <Collapsible className="border rounded-lg bg-card mt-6">
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 font-semibold hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Map className="w-5 h-5 text-primary" /> Roadmap to 100% Match
                        </div>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 pt-0 border-t">
                        <div className="space-y-6 pt-4">
                          {role.roadmap.map(rm => (
                            <div key={rm.week} className="relative pl-6 border-l-2 border-muted ml-3">
                              <div className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold -left-[13px] -top-1">
                                {rm.week}
                              </div>
                              <h5 className="font-bold text-base mb-2">{rm.focus}</h5>
                              <ul className="space-y-2">
                                {rm.tasks.map((task, t) => (
                                  <li key={t} className="text-sm text-muted-foreground flex gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
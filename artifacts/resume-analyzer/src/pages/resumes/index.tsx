import { Link } from "wouter";
import { useListResumes } from "@workspace/api-client-react";
import { FileText, Plus, Clock, Target, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "analyzed":
      return <Badge variant="default" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20">Analyzed</Badge>;
    case "analyzing":
      return (
        <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/20">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Uploaded</Badge>;
  }
}

export default function ResumesList() {
  const { data: resumes, isLoading } = useListResumes();

  return (
    <div className="container py-8 px-4 md:px-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Resumes</h1>
          <p className="text-muted-foreground mt-1">Manage and review your resume analyses.</p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Resume
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : resumes && resumes.length > 0 ? (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <Link key={resume.id} href={`/resumes/${resume.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate max-w-full">{resume.fileName}</h3>
                        <StatusBadge status={resume.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(resume.createdAt), "MMM d, yyyy")}
                        </div>
                        {resume.topRole && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" />
                            Best fit: <span className="font-medium text-foreground">{resume.topRole}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {resume.status === "analyzed" && resume.atsScore != null && (
                      <div className="shrink-0 flex items-center justify-center sm:w-20 text-center sm:text-right">
                        <div className="flex flex-col items-center sm:items-end">
                          <span className={`text-3xl font-bold tracking-tighter ${
                            resume.atsScore >= 80 ? "text-green-600" :
                            resume.atsScore >= 60 ? "text-amber-500" : "text-destructive"
                          }`}>
                            {resume.atsScore}
                          </span>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">ATS Score</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed rounded-xl bg-accent/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No resumes found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Upload a PDF resume to get your ATS score, feedback, and targeted job recommendations.
          </p>
          <Link href="/upload">
            <Button>Upload your first resume</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
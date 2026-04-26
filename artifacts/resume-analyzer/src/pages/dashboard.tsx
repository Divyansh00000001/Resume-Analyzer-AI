import { useGetDashboardSummary, useListResumes } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { FileText, Activity, TrendingUp, Trophy, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";

function DashboardSkeleton() {
  return (
    <div className="container py-8 px-4 md:px-6 space-y-8 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();

  if (isLoadingSummary) {
    return <DashboardSkeleton />;
  }

  const isEmpty = summary?.totalResumes === 0;

  if (isEmpty) {
    return (
      <div className="container flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          You haven't uploaded any resumes yet. Start your journey by uploading your first resume for AI analysis.
        </p>
        <Link href="/upload">
          <Button size="lg" className="h-12 px-8 text-base rounded-full">
            <Plus className="mr-2 h-5 w-5" />
            Upload New Resume
          </Button>
        </Link>
      </div>
    );
  }

  const chartData = summary?.topRoleMatches.map((match) => ({
    name: match.role,
    match: match.averageMatch,
  })) || [];

  return (
    <div className="container py-8 px-4 md:px-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here is a summary of your resume analyses.</p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Resume
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Resumes" 
          value={summary?.totalResumes || 0} 
          icon={FileText} 
        />
        <StatCard 
          title="Analyzed" 
          value={summary?.analyzedResumes || 0} 
          icon={Activity} 
        />
        <StatCard 
          title="Average ATS Score" 
          value={summary?.averageAtsScore ? `${summary.averageAtsScore}%` : "-"} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Best ATS Score" 
          value={summary?.bestAtsScore ? `${summary.bestAtsScore}%` : "-"} 
          icon={Trophy} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Role Matches</CardTitle>
            <CardDescription>Average match percentage across your resumes</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} width={120} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`${value}%`, 'Match']}
                  />
                  <Bar dataKey="match" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No role data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest uploaded resumes</CardDescription>
            </div>
            <Link href="/resumes">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                summary.recentActivity.map((activity) => (
                  <Link key={activity.id} href={`/resumes/${activity.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="font-medium text-sm truncate">{activity.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary font-medium capitalize">
                          {activity.status}
                        </span>
                        {activity.atsScore != null && (
                          <span className={`text-sm font-bold ${
                            activity.atsScore >= 80 ? "text-green-600" :
                            activity.atsScore >= 60 ? "text-amber-500" : "text-destructive"
                          }`}>
                            {activity.atsScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
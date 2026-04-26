import { Show } from "@clerk/react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileCheck, Search, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { useListJobRoles } from "@workspace/api-client-react";

export default function Home() {
  const { data: jobRoles } = useListJobRoles();

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <div className="min-h-[100dvh] flex flex-col bg-background font-sans">
          <header className="flex items-center justify-between px-6 py-5 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight">ResumeCoach</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="font-medium px-6">Get Started</Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 flex flex-col">
            {/* HERO */}
            <section className="px-4 py-24 md:py-32 flex flex-col items-center text-center bg-gradient-to-b from-primary/5 to-background border-b border-border">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-6">
                Powered by Advanced AI
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-foreground leading-[1.1]">
                Land the job you deserve.
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                Upload your resume. Get an honest ATS score, missing-keyword analysis, and a personalized roadmap toward your best-fit roles. 
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                    Start Analysis Now <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Free to try. No credit card required.</p>
            </section>

            {/* HOW IT WORKS */}
            <section className="px-4 py-24 bg-background">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold">Like having a senior recruiter by your side.</h2>
                  <p className="mt-4 text-lg text-muted-foreground">Three simple steps to a highly optimized resume.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">1. Upload PDF</h3>
                    <p className="text-muted-foreground">Drop your current resume. We accept standard PDFs and instantly parse your experience.</p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">2. AI Analysis</h3>
                    <p className="text-muted-foreground">Our engine simulates standard ATS filters to score your keywords, skills, and formatting.</p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">3. Action Plan</h3>
                    <p className="text-muted-foreground">Get rewritten bullet points and a week-by-week roadmap to bridge your skill gaps.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SOCIAL PROOF / TRUST */}
            <section className="px-4 py-20 bg-accent/30 border-y border-border">
              <div className="max-w-4xl mx-auto text-center space-y-12">
                <h2 className="text-2xl font-bold text-muted-foreground">Trusted by job seekers landing roles at top companies</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale items-center justify-items-center">
                  <div className="font-bold text-xl tracking-tighter">TECHCORP</div>
                  <div className="font-bold text-xl tracking-wider">GLOBAL NET</div>
                  <div className="font-bold text-xl italic">Innovate.io</div>
                  <div className="font-bold text-xl">CloudScale</div>
                </div>
              </div>
            </section>

            {/* BROWSE ROLES */}
            <section className="px-4 py-24 bg-background">
              <div className="max-w-6xl mx-auto">
                <div className="mb-12 md:flex md:items-end justify-between text-center md:text-left">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Target your dream role.</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      Optimize your resume for specific career paths. We analyze against current industry requirements.
                    </p>
                  </div>
                  <Link href="/sign-up">
                    <Button variant="outline" className="mt-6 md:mt-0">View all roles</Button>
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobRoles?.slice(0, 6).map((role) => (
                    <div key={role.slug} className="border border-border rounded-xl p-6 hover:border-primary/50 transition-colors bg-card shadow-sm">
                      <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">{role.category}</div>
                      <h3 className="text-xl font-bold mb-3">{role.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {role.coreSkills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                        {role.coreSkills.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md font-medium">
                            +{role.coreSkills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* CTA */}
            <section className="px-4 py-24 bg-primary text-primary-foreground text-center">
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl font-bold">Ready to beat the ATS?</h2>
                <p className="text-xl opacity-90">Join thousands of job seekers who optimized their resumes and landed their dream roles.</p>
                <Link href="/sign-up">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-full mt-4">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </section>
          </main>

          <footer className="py-8 px-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Logo" className="w-5 h-5 grayscale opacity-50" />
              <span>© {new Date().getFullYear()} ResumeCoach. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </footer>
        </div>
      </Show>
    </>
  );
}
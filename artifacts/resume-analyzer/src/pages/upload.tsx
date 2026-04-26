import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useDropzone } from "react-dropzone";
import { FileUp, File, X, Loader2, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUploadResume, useAnalyzeResume, useListJobRoles, getGetResumeQueryKey, getListResumesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>("");

  const { data: jobRoles } = useListJobRoles();
  const uploadMutation = useUploadResume();
  const analyzeMutation = useAnalyzeResume();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).replace(/^data:application\/pdf;base64,/, "");
        
        try {
          const resume = await uploadMutation.mutateAsync({
            data: {
              fileName: file.name,
              fileBase64: base64String
            }
          });
          
          queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });

          toast({
            title: "Resume uploaded successfully",
            description: "Starting analysis...",
          });

          // Trigger analysis
          analyzeMutation.mutate({
            id: resume.id,
            data: {
              targetRole: targetRole || null
            }
          });

          // Navigate to detail page
          setLocation(`/resumes/${resume.id}`);
          
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "There was an error uploading your resume. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "File reading error",
          description: "Could not read the PDF file.",
          variant: "destructive"
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
    }
  };

  const isPending = uploadMutation.isPending;

  return (
    <div className="container py-12 px-4 max-w-3xl mx-auto flex-1 flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Analyze Resume</h1>
        <p className="text-muted-foreground mt-2 text-lg">Upload your resume as a PDF to get actionable feedback.</p>
      </div>

      <Card className="w-full border-border shadow-sm">
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
          <CardDescription>Drag and drop your resume, or click to browse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center gap-4
                ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"}`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-muted-foreground">
                <FileUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-medium">Drop your PDF here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
              </div>
            </div>
          ) : (
            <div className="border rounded-xl p-6 bg-accent/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <File className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} disabled={isPending}>
                <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target Role (Optional)
            </Label>
            <Select value={targetRole} onValueChange={setTargetRole} disabled={isPending}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role to optimize for..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General Analysis</SelectItem>
                {jobRoles?.map((role) => (
                  <SelectItem key={role.slug} value={role.title}>
                    {role.title} <span className="text-muted-foreground ml-1">({role.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              If selected, your resume will be scored specifically against the requirements for this role.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-accent/30 border-t p-6">
          <Button 
            className="w-full h-12 text-lg" 
            disabled={!file || isPending} 
            onClick={handleUpload}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload and Analyze"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
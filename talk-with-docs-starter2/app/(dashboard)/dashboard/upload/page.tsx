"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, File, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

import { getPdfPageCount } from "@/lib/get-pdf-count";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    console.log("Updated pageCounts:", pageCounts);
  }, [pageCounts]);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
  
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter(
          (file) => file.type === "application/pdf"
        );
  
        if (newFiles.length === 0) {
          toast({
            title: "Invalid file type",
            description: "Only PDF files are supported.",
            variant: "destructive",
          });
          return;
        }
  
        // ✅ Extract page count here like in handleFileSelect
        const pageCountsMap: Record<string, number> = {};
  
        for (const file of newFiles) {
          try {
            const count = await getPdfPageCount(file);
            const key = `${file.name}_${file.size}`;
            pageCountsMap[key] = count;
          } catch (error) {
            console.error(`Failed to get page count for ${file.name}`, error);
          }
        }
  
        setPageCounts((prev) => ({ ...prev, ...pageCountsMap }));
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [toast]
  );
  

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
  
    const filesArray = Array.from(e.target.files).filter(
      (file) => file.type === "application/pdf"
    );
  
    if (filesArray.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are supported.",
        variant: "destructive",
      });
      return;
    }
  
    const pageCountsMap: Record<string, number> = {};
  
    for (const file of filesArray) {
      try {
        const count = await getPdfPageCount(file);
        const key = `${file.name}_${file.size}`;
        pageCountsMap[key] = count;
      } catch (error) {
        console.error(`Failed to get page count for ${file.name}`, error);
      }
    }
  
    // ✅ Set state in correct order
    setPageCounts((prev) => ({ ...prev, ...pageCountsMap }));
    setFiles((prev) => [...prev, ...filesArray]);
  }; 
  
  

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File) => {
    const file_title = file.name;
    const file_type = file.type;
    const file_size = file.size;
    
    // Get PDF page count
    let page_count = 0;
    try {
      page_count = await getPdfPageCount(file);
    } catch (error) {
      console.error("Error getting PDF page count:", error);
    }

    // Step 1: Get pre-signed URL from our Next.js API route
    const response = await fetch(`/api/upload/generate-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_title, file_type, file_size, page_count }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const { upload_url, document_id } = await response.json();

    // Step 2: Upload file directly to S3 using the pre-signed URL
    const uploadResponse = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file_type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`);
    }

    console.log("Upload complete. Document ID:", document_id);
    return document_id;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Track successful uploads
      let successCount = 0;
      let documentIds: string[] = [];

      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = Math.round((i / files.length) * 100);
        setProgress(fileProgress);

        // Upload the current file
        try {
          const documentId = await uploadFile(file);
          documentIds.push(documentId);
          successCount++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: `Failed to upload ${file.name}`,
            description: "There was an error uploading this file.",
            variant: "destructive",
          });
        }
      }

      setProgress(100);
      setUploading(false);

      // Show success message
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} of ${
          files.length
        } document${files.length > 1 ? "s" : ""}.`,
      });

      // Redirect to documents page after successful upload
      if (successCount > 0) {
        setTimeout(() => {
          router.push("/dashboard/documents");
        }, 1000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your documents.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Upload Documents</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upload PDF Documents</CardTitle>
            <CardDescription>
              Drag and drop your PDF files or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                <Upload className="h-10 w-10 mb-2" />
                <h3 className="text-lg font-medium">
                  Drag & Drop PDF files here
                </h3>
                <p className="text-sm">or click to browse your files</p>
                <Input
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={uploading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="font-medium">
                  Selected Files ({files.length})
                </div>
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between space-x-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-primary/70" />
                      <div className="space-y-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {" "}
                          {pageCounts[`${file.name}_${file.size}`] !== undefined
                            ? `— ${pageCounts[`${file.name}_${file.size}`]} page${pageCounts[`${file.name}_${file.size}`] !== 1 ? "s" : ""}`
                            : "— counting pages..."}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <div>Uploading...</div>
                  <div>{progress}%</div>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={files.length === 0 || uploading}
            >
              Clear All
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length > 0 ? `(${files.length})` : ""}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
            <CardDescription>
              Tips for successful document uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Supported File Types</h4>
                <p className="text-sm text-muted-foreground">
                  Currently only PDF files are supported. Additional file types
                  will be supported in the future.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">File Size Limits</h4>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 50MB per file
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum total upload: 200MB
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Processing Time</h4>
                <p className="text-sm text-muted-foreground">
                  Documents are typically processed within a few minutes. Larger
                  documents may take longer.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Best Practices</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Ensure PDF documents are not password protected</li>
                  <li>
                    For best results, use searchable PDFs (not scanned images)
                  </li>
                  <li>Clear file names help with organization</li>
                  <li>
                    Documents with clear formatting produce better results
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

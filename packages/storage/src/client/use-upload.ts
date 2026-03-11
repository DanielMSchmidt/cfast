import { useState, useCallback } from "react";
import { useStorageConfig } from "./storage-provider.js";
import type { UploadResult } from "../types.js";

export type UploadHookResult = {
  accept: string;
  start: (file: File) => void;
  progress: number;
  isUploading: boolean;
  result: UploadResult | null;
  error: string | null;
  validationError: string | null;
  reset: () => void;
};

export function useUpload(name: string): UploadHookResult {
  const config = useStorageConfig();
  const filetype = config[name];

  if (!filetype) {
    throw new Error(`Unknown filetype: "${name}". Available: ${Object.keys(config).join(", ")}`);
  }

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const accept = filetype.accept.join(",");

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setResult(null);
    setError(null);
    setValidationError(null);
  }, []);

  const start = useCallback(
    (file: File) => {
      // Reset previous state
      setValidationError(null);
      setError(null);
      setResult(null);

      // Client-side validation: MIME type
      if (!filetype.accept.includes(file.type)) {
        setValidationError(
          `${file.type} is not accepted. Allowed: ${filetype.accept.join(", ")}`,
        );
        return;
      }

      // Client-side validation: file size
      if (file.size > filetype.maxSizeBytes) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const maxMB = (filetype.maxSizeBytes / (1024 * 1024)).toFixed(1);
        setValidationError(`File is ${sizeMB}MB but max is ${maxMB}MB`);
        return;
      }

      // Upload via XHR for progress tracking
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as UploadResult;
            setResult(data);
            setProgress(100);
          } catch {
            setError("Invalid response from server");
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText) as { detail?: string; message?: string };
            setError(data.detail ?? data.message ?? `Upload failed (${xhr.status})`);
          } catch {
            setError(`Upload failed (${xhr.status})`);
          }
        }
      });

      xhr.addEventListener("error", () => {
        setIsUploading(false);
        setError("Network error during upload");
      });

      xhr.open("POST", window.location.pathname);
      xhr.send(formData);
    },
    [filetype],
  );

  return {
    accept,
    start,
    progress,
    isUploading,
    result,
    error,
    validationError,
    reset,
  };
}

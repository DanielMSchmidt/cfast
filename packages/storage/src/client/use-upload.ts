import { useState, useCallback } from "react";
import { useStorageConfig } from "./storage-provider.js";
import type { UploadResult } from "../types.js";

/** Type guard: check that `value` is a non-null object with the given `keys`. */
function hasKeys<K extends string>(
  value: unknown,
  keys: readonly K[],
): value is Record<K, unknown> {
  if (typeof value !== "object" || value === null) return false;
  for (const k of keys) {
    if (!(k in value)) return false;
  }
  return true;
}

/**
 * Validate that a parsed JSON value matches the {@link UploadResult} shape.
 *
 * @returns The validated result, or `null` if the shape doesn't match.
 */
function parseUploadResult(value: unknown): UploadResult | null {
  if (
    hasKeys(value, ["key", "size", "type"]) &&
    typeof value.key === "string" &&
    typeof value.size === "number" &&
    typeof value.type === "string"
  ) {
    return { key: value.key, size: value.size, type: value.type };
  }
  return null;
}

/**
 * Extract a human-readable error string from a parsed JSON error body.
 *
 * Looks for `detail` or `message` string fields, returning `undefined` if
 * neither is found.
 */
function parseErrorDetail(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if ("detail" in value && typeof value.detail === "string") return value.detail;
  if ("message" in value && typeof value.message === "string") return value.message;
  return undefined;
}

/** Return value of the {@link useUpload} hook. */
export type UploadHookResult = {
  /** Comma-separated MIME types suitable for an `<input accept>` attribute. */
  accept: string;
  /** Begin uploading a file (runs client-side validation first). */
  start: (file: File) => void;
  /** Upload progress percentage (0-100). */
  progress: number;
  /** `true` while the file is being uploaded. */
  isUploading: boolean;
  /** The upload result after a successful upload, or `null`. */
  result: UploadResult | null;
  /** Server or network error message, or `null`. */
  error: string | null;
  /** Client-side validation error (size/MIME), or `null`. */
  validationError: string | null;
  /** Reset the hook to its initial state. */
  reset: () => void;
};

/**
 * React hook for uploading a file with client-side validation and progress tracking.
 *
 * Must be used within a {@link StorageProvider}. Validates the file's MIME type
 * and size against the schema before sending, then uploads via XHR for
 * real-time progress.
 *
 * @param name - The file type name from the storage schema (e.g. `"avatars"`).
 * @returns An {@link UploadHookResult} with upload controls and state.
 * @throws If `name` is not a known file type in the storage config.
 *
 * @example
 * ```tsx
 * import { useUpload } from "@cfast/storage/client";
 *
 * function AvatarUploader() {
 *   const upload = useUpload("avatars");
 *   return (
 *     <input
 *       type="file"
 *       accept={upload.accept}
 *       onChange={(e) => upload.start(e.target.files[0])}
 *     />
 *   );
 * }
 * ```
 */
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
            const parsed: unknown = JSON.parse(xhr.responseText);
            const data = parseUploadResult(parsed);
            if (data) {
              setResult(data);
              setProgress(100);
            } else {
              setError("Invalid response from server");
            }
          } catch {
            setError("Invalid response from server");
          }
        } else {
          try {
            const parsed: unknown = JSON.parse(xhr.responseText);
            setError(parseErrorDetail(parsed) ?? `Upload failed (${xhr.status})`);
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

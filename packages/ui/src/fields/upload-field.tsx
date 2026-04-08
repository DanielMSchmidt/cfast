import { useCallback, useId, useRef, useState } from "react";
import type { UploadFieldFile, UploadFieldProps } from "../types.js";

/**
 * Default uploader implementation backed by `XMLHttpRequest` so we can
 * stream upload progress back into the field. Wraps the request in a
 * Promise that resolves with the parsed JSON body and supports
 * `AbortSignal` cancellation.
 *
 * Pulled out of the component body so tests can swap it via the
 * `uploader` prop without monkey-patching `XMLHttpRequest` globally.
 *
 * @internal
 */
function defaultUploader(
  file: File,
  options: {
    url: string;
    onProgress: (percent: number) => void;
    signal?: AbortSignal;
  },
): Promise<{ key: string; size: number; type: string; url?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", options.url);

    xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
      if (event.lengthComputable) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            key?: unknown;
            size?: unknown;
            type?: unknown;
            url?: unknown;
          };
          if (
            typeof parsed.key === "string" &&
            typeof parsed.size === "number" &&
            typeof parsed.type === "string"
          ) {
            resolve({
              key: parsed.key,
              size: parsed.size,
              type: parsed.type,
              url: typeof parsed.url === "string" ? parsed.url : undefined,
            });
            return;
          }
          reject(new Error("Invalid response from server"));
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            detail?: unknown;
            message?: unknown;
          };
          const detail =
            typeof parsed.detail === "string"
              ? parsed.detail
              : typeof parsed.message === "string"
                ? parsed.message
                : `Upload failed (${xhr.status})`;
          reject(new Error(detail));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload cancelled"));
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

/**
 * Match a file's MIME type against the comma-separated `accept` string from
 * the field props. Supports wildcards (`image/*`) and bare extensions
 * (`.png`) the same way the native `<input accept>` attribute does.
 *
 * @internal
 */
function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const fileType = (file.type || "").toLowerCase();
  const fileName = file.name.toLowerCase();
  for (const token of tokens) {
    if (token.startsWith(".")) {
      if (fileName.endsWith(token)) return true;
    } else if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1); // keep the trailing slash for an exact prefix match
      if (fileType.startsWith(prefix)) return true;
    } else if (token === fileType) {
      return true;
    }
  }
  return false;
}

/**
 * Format a byte count as a human-readable string. Mirrors the formatter
 * used elsewhere in `@cfast/ui` so size hints stay consistent across the
 * `FileField`, `FileList`, and `UploadField` components.
 *
 * @internal
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Headless multi-file upload field for cfast forms.
 *
 * `UploadField` is a controlled, form-friendly component that uploads files
 * through `@cfast/storage`'s opinionated `POST /uploads/:filetype` route
 * and surfaces the resulting R2 keys via the `value` / `onChange` pair.
 *
 * It is intentionally headless: the markup is plain HTML so consumers can
 * style it directly, and the Joy UI variant lives in `@cfast/joy`. The
 * component handles:
 *
 * - Drag-and-drop and click-to-browse selection.
 * - Per-file upload progress (via the configurable {@link UploadFieldProps.uploader}).
 * - Per-file inline error reporting (server, network, or validation).
 * - `accept` / `maxSize` / `maxFiles` enforcement before bytes leave the browser.
 * - Controlled `value` round-tripping for `react-hook-form` and other state libs.
 *
 * @example
 * ```tsx
 * <UploadField
 *   filetype="productImages"
 *   basePath="/uploads"
 *   multiple
 *   maxFiles={10}
 *   accept="image/*"
 *   value={imageKeys}
 *   onChange={setImageKeys}
 *   onError={(file) => console.warn(file.error)}
 * />
 * ```
 */
export function UploadField({
  label,
  className,
  filetype,
  basePath = "/uploads",
  multiple = false,
  maxFiles,
  accept,
  maxSize,
  value,
  onChange,
  onError,
  disabled = false,
  uploader = defaultUploader,
}: UploadFieldProps) {
  const [files, setFiles] = useState<UploadFieldFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();

  // Resolve a stable upload URL: ensure exactly one slash between base + filetype.
  const normalizedBase = `/${basePath.replace(/^\/+|\/+$/g, "")}`;
  const uploadUrl = `${normalizedBase}/${filetype}`;
  // Hard cap = explicit maxFiles, or 1 when single, or unlimited.
  const effectiveMax =
    maxFiles ?? (multiple ? Number.POSITIVE_INFINITY : 1);
  const currentValue = value ?? [];

  /**
   * Push a new key into the controlled `value` and notify the parent.
   * Always treats `value` as the source of truth — this is what makes the
   * field round-trip cleanly through `react-hook-form` even when the
   * component re-renders mid-upload.
   */
  const appendKey = useCallback(
    (key: string) => {
      const next = [...currentValue, key];
      onChange?.(next);
    },
    [currentValue, onChange],
  );

  /**
   * Remove a single key from the controlled `value`. Used by the
   * "Remove" button on previously-uploaded entries — separate from
   * the in-progress tracker which is keyed by file id.
   */
  const removeKey = useCallback(
    (key: string) => {
      const next = currentValue.filter((k) => k !== key);
      onChange?.(next);
    },
    [currentValue, onChange],
  );

  /**
   * Discard a tracker entry — used after a user dismisses an error
   * message, or after a successful upload settles into `value`.
   */
  const removeTrackerEntry = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      if (disabled) return;
      setGlobalError(null);

      const list = Array.from(incoming);
      if (list.length === 0) return;

      // Enforce maxFiles up-front: count successful uploads in `value`
      // plus any in-flight tracker entries that have not failed yet.
      const inFlight = files.filter((f) => f.status !== "error").length;
      const remainingSlots = effectiveMax - currentValue.length - inFlight;
      if (remainingSlots <= 0) {
        setGlobalError(
          `Maximum of ${effectiveMax} file${effectiveMax === 1 ? "" : "s"} reached`,
        );
        return;
      }
      if (list.length > remainingSlots) {
        setGlobalError(
          `Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} allowed`,
        );
        // Truncate but still upload what fits, mirroring how native
        // multi-select pickers behave when the user picks too many.
        list.length = remainingSlots;
      }

      // Validate each file against accept + maxSize before opening any XHRs.
      // We pre-collect the entries so we can splice them all into state in
      // one batch — that keeps re-render counts low and progress hooks tidy.
      const accepted: { entry: UploadFieldFile; file: File }[] = [];
      for (const file of list) {
        const id = `${reactId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!matchesAccept(file, accept)) {
          const errEntry: UploadFieldFile = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "error",
            error: `${file.type || "file"} is not an accepted type`,
          };
          accepted.push({ entry: errEntry, file });
          onError?.(errEntry);
          continue;
        }
        if (maxSize != null && file.size > maxSize) {
          const errEntry: UploadFieldFile = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "error",
            error: `File is ${formatBytes(file.size)} but max is ${formatBytes(maxSize)}`,
          };
          accepted.push({ entry: errEntry, file });
          onError?.(errEntry);
          continue;
        }
        accepted.push({
          entry: {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "pending",
          },
          file,
        });
      }

      setFiles((prev) => [...prev, ...accepted.map((a) => a.entry)]);

      // Kick off uploads for the entries that passed validation. Errors
      // already have status === "error" and were emitted via onError above.
      for (const { entry, file } of accepted) {
        if (entry.status === "error") continue;
        // Mark as uploading so the UI can show the progress bar.
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: "uploading" } : f,
          ),
        );
        try {
          const result = await uploader(file, {
            url: uploadUrl,
            onProgress: (percent) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === entry.id ? { ...f, progress: percent } : f,
                ),
              );
            },
          });
          // Promote the entry to success and append the key to the
          // controlled value before removing the tracker entry — that
          // ordering keeps the UI from briefly showing an empty file
          // list between "upload finished" and "value updated".
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "success", progress: 100, key: result.key }
                : f,
            ),
          );
          appendKey(result.key);
          // Settle into the controlled value: drop the tracker entry now
          // that the key lives in `value`.
          setFiles((prev) => prev.filter((f) => f.id !== entry.id));
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          const errEntry: UploadFieldFile = {
            ...entry,
            status: "error",
            error: message,
          };
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? errEntry : f)),
          );
          onError?.(errEntry);
        }
      }
    },
    [
      accept,
      appendKey,
      currentValue.length,
      disabled,
      effectiveMax,
      files,
      maxSize,
      onError,
      reactId,
      uploadUrl,
      uploader,
    ],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(e.target.files ?? []);
      // Reset the input so picking the same file again still fires onChange.
      e.target.value = "";
    },
    [handleFiles],
  );

  return (
    <div className={className} data-cfast-upload-field={filetype}>
      {label != null ? (
        <label
          htmlFor={`${reactId}-input`}
          style={{ display: "block", marginBottom: 4 }}
        >
          {label}
        </label>
      ) : null}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-drag-over={isDragOver}
        data-testid="upload-field-drop-zone"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        style={{
          border: "2px dashed",
          borderColor: isDragOver ? "#1976d2" : "#ccc",
          borderRadius: 4,
          padding: 16,
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {multiple ? "Drop files here or click to browse" : "Drop a file here or click to browse"}
      </div>
      <input
        ref={inputRef}
        id={`${reactId}-input`}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        style={{ display: "none" }}
        onChange={handleInputChange}
        data-testid="upload-field-input"
      />
      {globalError != null ? (
        <div role="alert" data-testid="upload-field-global-error" style={{ color: "#d32f2f", marginTop: 8 }}>
          {globalError}
        </div>
      ) : null}
      {currentValue.length > 0 ? (
        <ul
          data-testid="upload-field-value-list"
          style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}
        >
          {currentValue.map((key) => (
            <li
              key={key}
              data-testid="upload-field-value-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
              }}
            >
              <span style={{ flex: 1, fontSize: "0.85em" }}>{key}</span>
              <button
                type="button"
                onClick={() => removeKey(key)}
                disabled={disabled}
                aria-label={`Remove ${key}`}
                style={{
                  background: "none",
                  border: "none",
                  cursor: disabled ? "not-allowed" : "pointer",
                  color: "#d32f2f",
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {files.length > 0 ? (
        <ul
          data-testid="upload-field-tracker"
          style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}
        >
          {files.map((file) => (
            <li
              key={file.id}
              data-testid="upload-field-tracker-item"
              data-status={file.status}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "4px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1 }}>{file.name}</span>
                <span style={{ color: "#666", fontSize: "0.85em" }}>
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeTrackerEntry(file.id)}
                  aria-label={`Dismiss ${file.name}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>
              {file.status === "uploading" ? (
                <progress
                  data-testid="upload-field-progress"
                  value={file.progress}
                  max={100}
                  style={{ width: "100%" }}
                />
              ) : null}
              {file.status === "error" && file.error != null ? (
                <div
                  role="alert"
                  data-testid="upload-field-file-error"
                  style={{ color: "#d32f2f", fontSize: "0.85em" }}
                >
                  {file.error}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

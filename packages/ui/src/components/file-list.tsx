import type { FileListProps, FileListFile } from "../types.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Headless FileList — displays a list of files with download links.
 */
export function FileList({
  files,
  onDownload,
}: FileListProps) {
  if (files.length === 0) {
    return <div style={{ color: "#999" }}>No files</div>;
  }

  return (
    <ul
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      data-testid="file-list"
    >
      {files.map((file) => (
        <FileListItem
          key={file.key}
          file={file}
          onDownload={onDownload}
        />
      ))}
    </ul>
  );
}

function FileListItem({
  file,
  onDownload,
}: {
  file: FileListFile;
  onDownload?: (file: FileListFile) => void;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span style={{ flex: 1 }}>{file.name}</span>
      {file.size != null ? (
        <span style={{ color: "#666", fontSize: "0.85em" }}>{formatBytes(file.size)}</span>
      ) : null}
      {onDownload ? (
        <button
          onClick={() => onDownload(file)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#1976d2",
            textDecoration: "underline",
          }}
        >
          Download
        </button>
      ) : file.url ? (
        <a
          href={file.url}
          download={file.name}
          style={{ color: "#1976d2", textDecoration: "underline" }}
        >
          Download
        </a>
      ) : null}
    </li>
  );
}

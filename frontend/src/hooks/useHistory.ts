import { useState, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  tool: "marketing" | "branding" | "batch";
  prompt: string;
  imageUrl: string; // thumbnail data URL (resized to ~100px)
}

const STORAGE_KEY = "websyncer:generation-history";
const MAX_ENTRIES = 30;
const THUMBNAIL_SIZE = 100; // px — small enough to avoid localStorage quota issues

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // Quota exceeded — trim more aggressively
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 10)));
    } catch {
      // Give up
    }
  }
}

/**
 * Resize a base64 data URL image to a small thumbnail.
 * Returns a compressed JPEG data URL (~2-5KB instead of 1-3MB).
 */
function createThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        THUMBNAIL_SIZE / img.width,
        THUMBNAIL_SIZE / img.height,
      );
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } else {
        // Fallback: store nothing rather than a huge image
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback(
    async (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
      // Create thumbnail to avoid localStorage quota exhaustion
      const thumbnail = await createThumbnail(entry.imageUrl);
      if (!thumbnail) return; // Skip if thumbnail creation failed

      const newEntry: HistoryEntry = {
        ...entry,
        imageUrl: thumbnail,
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        prompt: entry.prompt.slice(0, 200), // Truncate prompt too
      };

      setEntries((prev) => {
        const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(next);
        return next;
      });
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { entries, addEntry, clearHistory };
}

import type { BatchAspectRatio, BatchPromptItem } from '../types/batch';

/** Generate a unique ID for batch items */
export function generateBatchItemId(): string {
    return crypto.randomUUID();
}

/** Default aspect ratio */
export const DEFAULT_ASPECT_RATIO: BatchAspectRatio = '1:1';

/** Available aspect ratios for display */
export const ASPECT_RATIO_OPTIONS: { value: BatchAspectRatio; label: string }[] = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:4', label: '3:4 (Portrait Std)' },
];

/**
 * Parse quick mode textarea into batch items.
 * One prompt per line, blank lines are skipped.
 */
export function parseQuickInput(
    text: string,
    globalAspectRatio: BatchAspectRatio,
): BatchPromptItem[] {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((prompt, index) => ({
            id: generateBatchItemId(),
            prompt,
            aspectRatio: globalAspectRatio,
            filename: `batch-${String(index + 1).padStart(3, '0')}.webp`,
            status: 'pending' as const,
        }));
}

/** Convert structured items back to quick mode text */
export function itemsToQuickText(items: BatchPromptItem[]): string {
    return items.map((item) => item.prompt).join('\n');
}

/** Count non-empty lines in quick mode text */
export function countPrompts(text: string): number {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0).length;
}

/** Generate a timestamped filename */
export function generateTimestampFilename(index: number): string {
    const now = new Date();
    const ts = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        '-',
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
    ].join('');
    return `batch-${ts}-${String(index + 1).padStart(3, '0')}.webp`;
}

/**
 * Append aspect ratio instruction to prompt for Gemini 3 Pro
 * since the model doesn't have a native aspect ratio parameter.
 */
export function enhancePromptWithAspectRatio(
    prompt: string,
    aspectRatio: BatchAspectRatio,
): string {
    const ratioDescriptions: Record<BatchAspectRatio, string> = {
        '1:1': 'square format (1:1 aspect ratio)',
        '16:9': 'wide landscape format (16:9 aspect ratio)',
        '9:16': 'tall portrait format (9:16 aspect ratio)',
        '4:3': 'standard landscape format (4:3 aspect ratio)',
        '3:4': 'standard portrait format (3:4 aspect ratio)',
    };
    return `${prompt}\n\nGenerate this image in ${ratioDescriptions[aspectRatio]}.`;
}

/**
 * Parse a Markdown file containing image prompts into batch items.
 *
 * Supports multiple formats:
 *
 * Format A — Bold headers + code blocks (insole design plan):
 *   **Category — Design Name**
 *   ```
 *   prompt text here --ar 2:3 --v 6.1
 *   ```
 *
 * Format B — Numbered headings + paragraph text:
 *   ## 1. Command Center (notes)
 *   A polished dark-themed SaaS dashboard...
 *   ---
 *
 * Format C — Simple headings + paragraph text:
 *   ## Hero Image
 *   A wide landscape photo of a mountain...
 *
 * The parser auto-detects the format and:
 * - Extracts headings to derive filenames
 * - Strips Midjourney flags (--ar, --v, --style, etc.)
 * - Skips metadata lines (lines starting with **Style**, **Dimensions**, etc.)
 */
export function parseMarkdownPrompts(
    markdown: string,
    defaultAspectRatio: BatchAspectRatio = '1:1',
): { items: BatchPromptItem[]; sectionName: string | null } {
    // Try Format A first (bold headers + code blocks)
    const formatA = parseFormatA(markdown, defaultAspectRatio);
    if (formatA.items.length > 0) {
        return formatA;
    }

    // Try Format B/C (headings + paragraph text)
    const formatB = parseFormatB(markdown, defaultAspectRatio);
    return formatB;
}

/**
 * Format A: Bold headers (**Category — Name**) with code block prompts.
 * Also supports section headers like ### Young Athletes Prompts.
 */
function parseFormatA(
    markdown: string,
    defaultAspectRatio: BatchAspectRatio,
): { items: BatchPromptItem[]; sectionName: string | null } {
    const items: BatchPromptItem[] = [];
    let currentSection: string | null = null;
    let currentCategory: string | null = null;
    let currentDesignName: string | null = null;

    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let promptLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect section headers like "### Young Athletes Prompts"
        const sectionMatch = trimmed.match(/^#{1,4}\s+(.+?)\s*(?:Prompts?)?\s*$/i);
        if (sectionMatch && !inCodeBlock) {
            const sectionText = sectionMatch[1].toLowerCase();
            if (sectionText.includes('young athlete')) {
                currentSection = 'young-athlete';
            } else if (sectionText.includes('pro athlete')) {
                currentSection = 'pro-athlete';
            } else if (
                sectionText.includes('comfort') ||
                sectionText.includes('senior')
            ) {
                currentSection = 'comfort';
            }
        }

        // Detect bold headers: **Category — Design Name**
        const boldMatch = trimmed.match(
            /^\*\*(.+?)\s*[—–-]\s*(.+?)\*\*$/,
        );
        if (boldMatch && !inCodeBlock) {
            currentCategory = boldMatch[1].trim();
            currentDesignName = boldMatch[2].trim();
            continue;
        }

        // Code block boundaries
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block — process collected prompt
                if (currentCategory && currentDesignName && promptLines.length > 0) {
                    const rawPrompt = promptLines.join('\n').trim();
                    const cleanedPrompt = stripMidjourneyFlags(rawPrompt);
                    const filename = buildFilename(
                        currentSection,
                        currentCategory,
                        currentDesignName,
                    );

                    items.push({
                        id: generateBatchItemId(),
                        prompt: cleanedPrompt,
                        aspectRatio: defaultAspectRatio,
                        filename,
                        status: 'pending',
                    });
                }
                inCodeBlock = false;
                promptLines = [];
            } else {
                inCodeBlock = true;
                promptLines = [];
            }
            continue;
        }

        // Collect lines inside code blocks
        if (inCodeBlock) {
            promptLines.push(line);
        }
    }

    return { items, sectionName: currentSection };
}

/** Lines starting with these patterns are metadata, not prompts */
const METADATA_PREFIXES = [
    /^\*\*style/i,
    /^\*\*dimensions/i,
    /^\*\*format/i,
    /^\*\*size/i,
    /^\*\*resolution/i,
    /^\*\*note/i,
    /^\*\*output/i,
    /^use these/i,
    /^generate at/i,
];

function isMetadataLine(line: string): boolean {
    return METADATA_PREFIXES.some((re) => re.test(line));
}

/**
 * Format B/C: Heading-based sections where each ## heading introduces a prompt.
 * The prompt is the paragraph text following the heading until the next heading or ---.
 *
 * Handles patterns like:
 *   ## 1. Command Center (REPLACEMENT — current image is low-res)
 *   ## Hero Image
 *   ## Product Screenshot
 */
function parseFormatB(
    markdown: string,
    defaultAspectRatio: BatchAspectRatio,
): { items: BatchPromptItem[]; sectionName: string | null } {
    const items: BatchPromptItem[] = [];
    const lines = markdown.split('\n');

    let currentHeading: string | null = null;
    let promptLines: string[] = [];

    const flushCurrent = () => {
        if (currentHeading && promptLines.length > 0) {
            const rawPrompt = promptLines.join(' ').trim();
            // Skip if the "prompt" is too short (likely just a label or empty section)
            if (rawPrompt.length > 30) {
                const cleanedPrompt = stripMidjourneyFlags(rawPrompt);
                const name = extractHeadingName(currentHeading);
                const filename = slugify(name) + '.webp';

                items.push({
                    id: generateBatchItemId(),
                    prompt: cleanedPrompt,
                    aspectRatio: defaultAspectRatio,
                    filename,
                    status: 'pending',
                });
            }
        }
        currentHeading = null;
        promptLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        // Skip empty lines, horizontal rules, and code blocks for this format
        if (trimmed === '' || trimmed === '---') {
            continue;
        }

        // Detect headings (## level or deeper)
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushCurrent();
            const level = headingMatch[1].length;
            const headingText = headingMatch[2].trim();

            // Level 1 headings (#) are typically doc titles — skip them as prompt sources
            // Level 2+ headings (##, ###) are section/item headings
            if (level >= 2) {
                currentHeading = headingText;
            }
            continue;
        }

        // Skip metadata lines (bold style references, dimension notes, etc.)
        if (isMetadataLine(trimmed)) {
            continue;
        }

        // If we have a current heading, collect paragraph text as prompt
        if (currentHeading) {
            promptLines.push(trimmed);
        }
    }

    // Flush the last section
    flushCurrent();

    return { items, sectionName: null };
}

/**
 * Extract a clean name from a heading like:
 *   "1. Command Center (REPLACEMENT — current image is low-res)" → "Command Center"
 *   "AI Copilot (NEW — currently missing)" → "AI Copilot"
 *   "Hero Image" → "Hero Image"
 */
function extractHeadingName(heading: string): string {
    return heading
        // Remove leading numbers: "1. " "2. " etc.
        .replace(/^\d+\.\s*/, '')
        // Remove parenthetical notes: "(REPLACEMENT — ...)" "(NEW — ...)"
        .replace(/\s*\(.*?\)\s*/g, '')
        .trim();
}

/**
 * Strip Midjourney-specific flags from a prompt string.
 * Removes: --ar, --v, --style, --s, --q, --chaos, --no, --seed, --stop, --tile, etc.
 */
function stripMidjourneyFlags(prompt: string): string {
    return prompt
        .replace(/\s*--(?:ar|v|style|s|q|chaos|no|seed|stop|tile|iw|niji|test|testp|hd|upbeta|upanime|creative|stylize|quality|repeat|r|weird|w)\s+\S+/g, '')
        .replace(/\s*--(?:ar|v|style|s|q|chaos|no|seed|stop|tile|iw|niji|test|testp|hd|upbeta|upanime|creative|stylize|quality|repeat|r|weird|w)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Convert a string to a URL/filename-safe slug */
function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Build a filename from section, category, and design name.
 * e.g. "young-athlete", "Fantasy", "Rainbow Unicorn" → "young-athlete/fantasy/rainbow-unicorn.webp"
 */
function buildFilename(
    section: string | null,
    category: string,
    designName: string,
): string {
    const parts: string[] = [];
    if (section) parts.push(section);
    parts.push(slugify(category));
    parts.push(slugify(designName) + '.webp');

    return parts.join('/');
}

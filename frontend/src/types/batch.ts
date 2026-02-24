/** Aspect ratio choices for batch generation */
export type BatchAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

/** A single prompt item in the batch queue */
export interface BatchPromptItem {
    id: string;
    prompt: string;
    aspectRatio: BatchAspectRatio;
    filename: string;
    status: 'pending' | 'generating' | 'success' | 'error';
    imageUrl?: string;
    error?: string;
}

/** Input mode for the batch editor */
export type BatchInputMode = 'quick' | 'structured';

/** Batch generation progress */
export interface BatchGenerationProgress {
    total: number;
    completed: number;
    current: string;
    results: Array<{
        id: string;
        success: boolean;
        imageUrl?: string;
        error?: string;
    }>;
    cancelled?: boolean;
}

/** Save server status */
export interface SaveServerStatus {
    status: string;
    targetDir: string;
    exists: boolean;
    supportsCustomTargetDir?: boolean;
}

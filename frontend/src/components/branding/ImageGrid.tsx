import React from 'react';
import type { ImageSpec } from '../../types/branding';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
    images: ImageSpec[];
    generatedImages: Map<string, string>;
    generatingId: string | null;
    onGenerate: (imageId: string, customPrompt?: string) => void;
    onDownload: (imageId: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
    images,
    generatedImages,
    generatingId,
    onGenerate,
    onDownload,
}) => {
    if (images.length === 0) {
        return (
            <div className="text-center py-12 text-brand-muted">
                No images in this category
            </div>
        );
    }

    // Determine grid columns based on aspect ratio
    const firstImage = images[0];
    const isSquare = firstImage.aspectRatio === '1:1';
    const isPortrait = firstImage.aspectRatio === '9:16' || firstImage.aspectRatio === '3:4';

    const gridClass = isSquare
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        : isPortrait
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
        <div className={`grid ${gridClass} gap-4`}>
            {images.map((spec) => (
                <ImageCard
                    key={spec.id}
                    spec={spec}
                    generatedUrl={generatedImages.get(spec.id)}
                    isGenerating={generatingId === spec.id}
                    onGenerate={(customPrompt) => onGenerate(spec.id, customPrompt)}
                    onDownload={() => onDownload(spec.id)}
                />
            ))}
        </div>
    );
};

import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxFiles?: number;
}

export function FileDropZone({
    onFilesSelected,
    accept = 'image/png',
    multiple = true,
    maxFiles = 50,
}: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith('image/')
            );

            if (files.length > 0) {
                onFilesSelected(multiple ? files.slice(0, maxFiles) : [files[0]]);
            }
        },
        [onFilesSelected, multiple, maxFiles]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                onFilesSelected(multiple ? files.slice(0, maxFiles) : [files[0]]);
            }
            // Reset input so same file can be selected again
            e.target.value = '';
        },
        [onFilesSelected, multiple, maxFiles]
    );

    const handleClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            className={`drop-zone ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleInputChange}
                className="hidden"
            />
            <Upload className="w-12 h-12 text-brand-muted mx-auto mb-4" />
            <div className="text-white font-medium mb-2">
                Drop {multiple ? 'files' : 'file'} here or click to browse
            </div>
            <div className="text-brand-muted text-sm">
                {accept === 'image/png' ? 'PNG files supported' : 'PNG, JPG, WebP supported'}
                {multiple && ` (max ${maxFiles} files)`}
            </div>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { FolderOpen, HardDrive, ChevronDown, Clock, X } from 'lucide-react';

const RECENT_FOLDERS_KEY = 'batch-generator-recent-folders';
const MAX_RECENT_FOLDERS = 10;

/** Load recent folders from localStorage */
function loadRecentFolders(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_FOLDERS_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter((f: unknown) => typeof f === 'string' && f.length > 0) : [];
    } catch {
        return [];
    }
}

/** Save a folder to the recent list (most recent first, deduplicated, max 10) */
export function addRecentFolder(path: string): void {
    if (!path.trim()) return;
    const trimmed = path.trim();
    const existing = loadRecentFolders();
    const updated = [trimmed, ...existing.filter((f) => f !== trimmed)].slice(0, MAX_RECENT_FOLDERS);
    localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(updated));
}

/** Remove a folder from the recent list */
function removeRecentFolder(path: string): string[] {
    const existing = loadRecentFolders();
    const updated = existing.filter((f) => f !== path);
    localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(updated));
    return updated;
}

interface TargetFolderInputProps {
    value: string;
    onChange: (path: string) => void;
    saverConnected: boolean;
    defaultPath: string;
}

export const TargetFolderInput: React.FC<TargetFolderInputProps> = ({
    value,
    onChange,
    saverConnected,
    defaultPath,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentFolders, setRecentFolders] = useState<string[]>(loadRecentFolders);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isDropdownOpen]);

    // Refresh recent list when dropdown opens
    const toggleDropdown = () => {
        if (!isDropdownOpen) {
            setRecentFolders(loadRecentFolders());
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const selectFolder = (path: string) => {
        onChange(path);
        setIsDropdownOpen(false);
        inputRef.current?.focus();
    };

    const handleRemove = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const updated = removeRecentFolder(path);
        setRecentFolders(updated);
    };

    return (
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FolderOpen size={16} className="text-brand-muted" />
                    <label className="form-label mb-0 text-xs">Target Folder</label>
                </div>
                <div className="flex items-center gap-2">
                    <HardDrive size={14} className={saverConnected ? 'text-green-500' : 'text-brand-muted'} />
                    <span
                        className={`text-xs font-medium ${
                            saverConnected ? 'text-green-500' : 'text-brand-muted'
                        }`}
                    >
                        {saverConnected ? 'Saver Connected' : 'Saver Offline'}
                    </span>
                </div>
            </div>

            {/* Input + dropdown trigger */}
            <div className="relative" ref={dropdownRef}>
                <div className="flex gap-0">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={defaultPath || '/path/to/your/output/directory'}
                        className="form-input w-full text-sm font-mono rounded-r-none border-r-0"
                    />
                    <button
                        type="button"
                        onClick={toggleDropdown}
                        className={`flex items-center justify-center px-3 border border-brand-border rounded-r-lg transition-colors ${
                            isDropdownOpen
                                ? 'bg-white/10 text-white'
                                : 'bg-brand-card text-brand-muted hover:text-white hover:bg-white/5'
                        } ${recentFolders.length === 0 ? 'opacity-40 cursor-default' : ''}`}
                        disabled={recentFolders.length === 0}
                        title={recentFolders.length === 0 ? 'No recent folders yet' : 'Recent folders'}
                    >
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>

                {/* Dropdown */}
                {isDropdownOpen && recentFolders.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-brand-border rounded-lg shadow-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-brand-border">
                            <Clock size={12} className="text-brand-muted" />
                            <span className="text-xs text-brand-muted font-medium">Recent Folders</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {recentFolders.map((folder, i) => (
                                <div
                                    key={`${folder}-${i}`}
                                    onClick={() => selectFolder(folder)}
                                    className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/5 ${
                                        folder === value ? 'bg-white/5' : ''
                                    }`}
                                >
                                    <span className="text-sm font-mono text-brand-muted group-hover:text-white truncate mr-2">
                                        {folder}
                                    </span>
                                    <button
                                        onClick={(e) => handleRemove(e, folder)}
                                        className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-brand-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                                        title="Remove from recent"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-brand-muted mt-2">
                {value
                    ? `Images will be saved to: ${value}`
                    : defaultPath
                      ? `Leave empty to use default: ${defaultPath}`
                      : 'Enter an absolute path where generated images should be saved.'}
            </p>
        </div>
    );
};

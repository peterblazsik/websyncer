import React from 'react';
import type { ImageCategory } from '../../types/branding';
import { CATEGORY_INFO } from '../../types/branding';
import { CATEGORY_COUNTS } from '../../lib/brandingConfig';
import { Image, Layers, Workflow, Users, ShoppingBag } from 'lucide-react';

interface CategorySelectorProps {
    activeCategory: ImageCategory;
    onCategoryChange: (category: ImageCategory) => void;
}

const categoryIcons: Record<ImageCategory, React.ReactNode> = {
    hero: <Image size={16} />,
    features: <Layers size={16} />,
    process: <Workflow size={16} />,
    lifestyle: <Users size={16} />,
    product: <ShoppingBag size={16} />,
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
    activeCategory,
    onCategoryChange,
}) => {
    const categories: ImageCategory[] = ['hero', 'features', 'process', 'lifestyle', 'product'];

    return (
        <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
                const info = CATEGORY_INFO[category];
                const count = CATEGORY_COUNTS[category];
                const isActive = activeCategory === category;

                return (
                    <button
                        key={category}
                        onClick={() => onCategoryChange(category)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                            transition-all duration-200 border
                            ${
                                isActive
                                    ? 'bg-white text-black border-white'
                                    : 'bg-transparent text-brand-muted border-brand-border hover:border-white/50 hover:text-white'
                            }
                        `}
                    >
                        {categoryIcons[category]}
                        <span className="uppercase tracking-wide">{info.label}</span>
                        <span
                            className={`
                            text-xs px-1.5 py-0.5 rounded
                            ${isActive ? 'bg-black/10' : 'bg-white/10'}
                        `}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

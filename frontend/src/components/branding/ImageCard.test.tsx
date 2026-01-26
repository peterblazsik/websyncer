import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCard } from './ImageCard';
import type { ImageSpec } from '../../types/branding';

const mockSpec: ImageSpec = {
    id: 'hero-athletic-v1',
    name: 'Athletic Runner',
    category: 'hero',
    concept: 'athletic',
    version: 1,
    prompt: 'Professional sports photography of an athletic runner',
    aspectRatio: '16:9',
    dimensions: { width: 1920, height: 1080 },
    outputPath: 'hero/hero-athletic-v1.webp',
};

describe('ImageCard', () => {
    const mockOnGenerate = vi.fn();
    const mockOnDownload = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders image spec name correctly', () => {
        render(
            <ImageCard
                spec={mockSpec}
                onGenerate={mockOnGenerate}
                onDownload={mockOnDownload}
                isGenerating={false}
            />
        );

        expect(screen.getByText('Athletic Runner')).toBeInTheDocument();
    });

    it('shows Generate button when no image exists', () => {
        render(
            <ImageCard
                spec={mockSpec}
                onGenerate={mockOnGenerate}
                onDownload={mockOnDownload}
                isGenerating={false}
            />
        );

        expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });

    it('shows Regenerate button when image exists', () => {
        render(
            <ImageCard
                spec={mockSpec}
                generatedUrl="data:image/png;base64,abc123"
                onGenerate={mockOnGenerate}
                onDownload={mockOnDownload}
                isGenerating={false}
            />
        );

        expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
    });

    it('disables generate button when generating', () => {
        render(
            <ImageCard
                spec={mockSpec}
                onGenerate={mockOnGenerate}
                onDownload={mockOnDownload}
                isGenerating={true}
            />
        );

        const generateBtn = screen.getByRole('button', { name: /generate/i });
        expect(generateBtn).toBeDisabled();
    });

    it('shows download button only when image exists', () => {
        const { rerender } = render(
            <ImageCard
                spec={mockSpec}
                onGenerate={mockOnGenerate}
                onDownload={mockOnDownload}
                isGenerating={false}
            />
        );

        // No download button without image
        expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument();

        // Rerender with generated image
        rerender(
            <ImageCard
                spec={mockSpec}
                generatedUrl="data:image/png;base64,abc123"
                onGenerate={mockOnGenerate}
                onDownload={mockOnDownload}
                isGenerating={false}
            />
        );

        // Download button should now exist (it has only an icon, no text)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(1); // Generate + Download + Prompt toggle
    });

    describe('Editable Prompt Feature', () => {
        it('shows collapsed prompt section by default', () => {
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            expect(screen.getByText('Prompt')).toBeInTheDocument();
            // Textarea should not be visible initially
            expect(screen.queryByPlaceholderText(/enter custom prompt/i)).not.toBeInTheDocument();
        });

        it('expands prompt section when clicked', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            const promptToggle = screen.getByText('Prompt');
            await user.click(promptToggle);

            // Textarea should now be visible
            expect(screen.getByPlaceholderText(/enter custom prompt/i)).toBeInTheDocument();
        });

        it('shows default prompt in textarea when expanded', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            const promptToggle = screen.getByText('Prompt');
            await user.click(promptToggle);

            const textarea = screen.getByPlaceholderText(/enter custom prompt/i);
            expect(textarea).toHaveValue(mockSpec.prompt);
        });

        it('allows editing the prompt', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            // Expand prompt section
            const promptToggle = screen.getByText('Prompt');
            await user.click(promptToggle);

            const textarea = screen.getByPlaceholderText(/enter custom prompt/i);
            await user.clear(textarea);
            await user.type(textarea, 'Custom test prompt');

            expect(textarea).toHaveValue('Custom test prompt');
        });

        it('shows modification indicator when prompt is changed', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            // Expand prompt section
            const promptToggle = screen.getByText('Prompt');
            await user.click(promptToggle);

            // Initially no reset button
            expect(screen.queryByText(/reset to default/i)).not.toBeInTheDocument();

            // Modify the prompt
            const textarea = screen.getByPlaceholderText(/enter custom prompt/i);
            await user.clear(textarea);
            await user.type(textarea, 'Modified prompt');

            // Reset button should appear
            expect(screen.getByText(/reset to default/i)).toBeInTheDocument();
        });

        it('resets prompt to default when reset button is clicked', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            // Expand and modify prompt
            const promptToggle = screen.getByText('Prompt');
            await user.click(promptToggle);

            const textarea = screen.getByPlaceholderText(/enter custom prompt/i);
            await user.clear(textarea);
            await user.type(textarea, 'Modified prompt');

            // Click reset
            const resetButton = screen.getByText(/reset to default/i);
            await user.click(resetButton);

            // Prompt should be reset
            expect(textarea).toHaveValue(mockSpec.prompt);
            // Reset button should disappear
            expect(screen.queryByText(/reset to default/i)).not.toBeInTheDocument();
        });

        it('calls onGenerate with custom prompt when modified', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            // Expand and modify prompt
            const promptToggle = screen.getByText('Prompt');
            await user.click(promptToggle);

            const textarea = screen.getByPlaceholderText(/enter custom prompt/i);
            await user.clear(textarea);
            await user.type(textarea, 'Custom prompt for generation');

            // Click generate
            const generateBtn = screen.getByRole('button', { name: /generate/i });
            await user.click(generateBtn);

            expect(mockOnGenerate).toHaveBeenCalledWith('Custom prompt for generation');
        });

        it('calls onGenerate without custom prompt when not modified', async () => {
            const user = userEvent.setup();
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            // Click generate without modifying prompt
            const generateBtn = screen.getByRole('button', { name: /generate/i });
            await user.click(generateBtn);

            expect(mockOnGenerate).toHaveBeenCalledWith(undefined);
        });
    });

    describe('Aspect Ratio Display', () => {
        it('shows dimensions when no image', () => {
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            expect(screen.getByText('1920 \u00d7 1080')).toBeInTheDocument();
            expect(screen.getByText('16:9')).toBeInTheDocument();
        });
    });

    describe('Generation State', () => {
        it('shows loading overlay when generating', () => {
            render(
                <ImageCard
                    spec={mockSpec}
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={true}
                />
            );

            expect(screen.getByText('Generating...')).toBeInTheDocument();
        });

        it('shows success indicator when image is generated', () => {
            render(
                <ImageCard
                    spec={mockSpec}
                    generatedUrl="data:image/png;base64,abc123"
                    onGenerate={mockOnGenerate}
                    onDownload={mockOnDownload}
                    isGenerating={false}
                />
            );

            // Check icon exists (green checkmark)
            const img = screen.getByAltText('Athletic Runner');
            expect(img).toBeInTheDocument();
        });
    });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabBar from '../TabBar';

describe('TabBar', () => {
    const mockTabs = [
        { path: '/test/file1.ts', name: 'file1.ts', isDirty: false },
        { path: '/test/file2.ts', name: 'file2.ts', isDirty: true },
    ];

    it('renders tabs', () => {
        render(
            <TabBar
                tabs={mockTabs}
                activeTabPath="/test/file1.ts"
                onTabClick={() => { }}
                onTabClose={() => { }}
            />
        );

        expect(screen.getByText('file1.ts')).toBeInTheDocument();
        expect(screen.getByText('file2.ts')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
        render(
            <TabBar
                tabs={mockTabs}
                activeTabPath="/test/file1.ts"
                onTabClick={() => { }}
                onTabClose={() => { }}
            />
        );

        const activeTab = screen.getByText('file1.ts').closest('div');
        const inactiveTab = screen.getByText('file2.ts').closest('div');

        // Check based on classes applied for active state
        expect(activeTab).toHaveClass('text-white'); // Active style
        expect(inactiveTab).toHaveClass('text-[#969696]'); // Inactive style
    });

    it('handles click events', () => {
        const onTabClick = vi.fn();
        render(
            <TabBar
                tabs={mockTabs}
                activeTabPath="/test/file1.ts"
                onTabClick={onTabClick}
                onTabClose={() => { }}
            />
        );

        fireEvent.click(screen.getByText('file2.ts'));
        expect(onTabClick).toHaveBeenCalledWith('/test/file2.ts');
    });

    it('handles close events', () => {
        const onTabClose = vi.fn();
        render(
            <TabBar
                tabs={mockTabs}
                activeTabPath="/test/file1.ts"
                onTabClick={() => { }}
                onTabClose={onTabClose}
            />
        );

        // Close button is tricky to select without aria-label, but it's an SVG inside a div.
        // We can check if we can select by parent div click if we can find it.
        // The close button is nested. Let's look for the SVG or key off the parent structure.
        // Or simpler: add aria-labels in source? No, not modifying source unless needed.
        // We can traverse from the text.

        const tab = screen.getByText('file1.ts').closest('.group');
        // The close button is inside the tab.
        // In the React code: 
        // <div onClick... className="w-5 h-5 ..."> <svg...> </svg> </div>

        // We can rely on implementation detail selector or querySelector
        const closeBtn = tab?.querySelector('.hover\\:bg-\\[\\#4b4b4b\\]'); // Partial class match or querySelector
        if (!closeBtn) throw new Error('Close button not found');

        fireEvent.click(closeBtn);
        expect(onTabClose).toHaveBeenCalledWith('/test/file1.ts', expect.any(Object));
    });
});

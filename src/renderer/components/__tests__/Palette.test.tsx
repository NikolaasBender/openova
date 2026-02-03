import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Palette from '../Palette';
import { vi, describe, it, expect } from 'vitest';

describe('Palette Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSelect = vi.fn();
    const mockItems = [
        { id: '1', label: 'Item One', detail: 'Detail One' },
        { id: '2', label: 'Item Two', detail: 'Detail Two' },
        { id: '3', label: 'Item Three' },
    ];

    beforeAll(() => {
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <Palette
                isOpen={false}
                mode="commands"
                items={mockItems}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should render items when open', () => {
        render(
            <Palette
                isOpen={true}
                mode="commands"
                items={mockItems}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        expect(screen.getByPlaceholderText('> Type a command')).toBeInTheDocument();
        expect(screen.getByText('Item One')).toBeInTheDocument();
        expect(screen.getByText('Item Two')).toBeInTheDocument();
        expect(screen.getByText('Item Three')).toBeInTheDocument();
    });

    it('should filter items based on input', () => {
        render(
            <Palette
                isOpen={true}
                mode="commands"
                items={mockItems}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        const input = screen.getByPlaceholderText('> Type a command');
        fireEvent.change(input, { target: { value: 'Two' } });

        expect(screen.queryByText('Item One')).not.toBeInTheDocument();
        expect(screen.getByText('Item Two')).toBeInTheDocument();
        expect(screen.queryByText('Item Three')).not.toBeInTheDocument();
    });

    it('should select item on click', () => {
        render(
            <Palette
                isOpen={true}
                mode="commands"
                items={mockItems}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        fireEvent.click(screen.getByText('Item One'));
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should handle keyboard navigation and selection', () => {
        render(
            <Palette
                isOpen={true}
                mode="commands"
                items={mockItems}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        const input = screen.getByPlaceholderText('> Type a command');

        // Initial state: first item selected (Item One)
        // Hit Enter
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);

        // Navigate Down -> Item Two
        fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);

        // Navigate Down -> Item Three
        fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[2]);

        // Navigate Up -> Item Two
        fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
    });

    it('should close on Escape', () => {
        render(
            <Palette
                isOpen={true}
                mode="commands"
                items={mockItems}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        const input = screen.getByPlaceholderText('> Type a command');
        fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
        expect(mockOnClose).toHaveBeenCalled();
    });
});

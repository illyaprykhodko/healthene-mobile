import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnytimeListItem } from '../src/components/AnytimeMenu/AnytimeListItem';

const baseFood = {
    id: 1,
    type: 'FOOD',
    status: 'PENDING',
    amount: 3.25,
    phaseId: 10,
    consumedAmount: 0,
    food: { name: 'Red Apple', coverImage: { url: 'http://example/img' } },
    weight: { unit: { name: 'small' } },
};

describe('AnytimeListItem (multi-serve)', () => {
    test('shows progress subtitle when partially consumed', () => {
        const onUpdateItem = jest.fn();
        const { getByText } = render(
            <AnytimeListItem
                item={{ ...baseFood, consumedAmount: 2 }}
                onUpdateItem={onUpdateItem}
            />
        );
        expect(getByText(/2 .* of .* 3 .* small/i)).toBeTruthy();
    });

    test('expand shows child units with checkboxes and toggles update', () => {
        const onUpdateItem = jest.fn();
        const { getByRole, getAllByRole } = render(
            <AnytimeListItem item={baseFood as any} onUpdateItem={onUpdateItem} />
        );
        // open chevron (button is treated as accessibility role "button")
        const buttons = getAllByRole('button');
        const chevron = buttons[0];
        fireEvent.press(chevron);

        // After expanding, toggle first unit's checkbox
        const checkboxes = getAllByRole('checkbox');
        fireEvent(checkboxes[0], 'onChange', true);
        expect(onUpdateItem).toHaveBeenCalled();
    });

    test('parent checkbox completes then resets all', () => {
        const onUpdateItem = jest.fn();
        // All consumed -> parent checkbox visible
        const { getAllByRole, rerender } = render(
            <AnytimeListItem item={{ ...baseFood, consumedAmount: 3.25 }} onUpdateItem={onUpdateItem} />
        );
        const parentCheckbox = getAllByRole('checkbox')[0];
        // tap -> reset to 0
        fireEvent(parentCheckbox, 'onChange', false);
        expect(onUpdateItem).toHaveBeenCalledWith(expect.objectContaining({ consumedAmount: 0, status: 'PENDING' }));

        // rerender partially consumed -> toggle to complete
        rerender(
            <AnytimeListItem item={{ ...baseFood, consumedAmount: 0 }} onUpdateItem={onUpdateItem} />
        );
        const parentCheckbox2 = getAllByRole('checkbox')[0];
        fireEvent(parentCheckbox2, 'onChange', true);
        expect(onUpdateItem).toHaveBeenCalledWith(expect.objectContaining({ consumedAmount: 3.25, status: 'DONE' }));
    });
});



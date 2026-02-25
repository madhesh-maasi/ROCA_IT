import { useState, useCallback } from 'react';

interface IUseBooleanReturn {
    value: boolean;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
}

/**
 * Custom hook for managing boolean state with semantic methods.
 * Useful for loading states, modal visibility, toggles, etc.
 *
 * @example
 * const { value: isLoading, setTrue: startLoading, setFalse: stopLoading } = useBoolean(false);
 * const { value: isModalOpen, setTrue: openModal, setFalse: closeModal } = useBoolean(false);
 */
export const useBoolean = (initialValue: boolean = false): IUseBooleanReturn => {
    const [value, setValue] = useState<boolean>(initialValue);

    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);
    const toggle = useCallback(() => setValue((prev) => !prev), []);

    return { value, setTrue, setFalse, toggle };
};

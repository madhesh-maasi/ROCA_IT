import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed version of `useDispatch` that knows about our thunks.
 * Use this instead of plain `useDispatch` everywhere in the solution.
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(fetchIncomeTaxItems({ getItems: service.getIncomeTaxItems }));
 */
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

/**
 * Typed version of `useSelector` that knows the full RootState shape.
 * Use this instead of plain `useSelector` for full IntelliSense.
 *
 * @example
 * const items = useAppSelector(selectIncomeTaxItems);
 * const isLoading = useAppSelector(selectIsLoading);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

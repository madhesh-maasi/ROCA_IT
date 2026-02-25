import * as React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import styles from './Loader.module.scss';

export interface ILoaderProps {
    /** Text to display below the spinner. */
    label?: string;
    /** Spinner size variant. Defaults to SpinnerSize.large. */
    size?: SpinnerSize;
}

/**
 * A reusable loading indicator component built on Fluent UI Spinner.
 * Use this wherever data is being fetched or processed asynchronously.
 *
 * @example
 * <Loader label="Loading tax records..." />
 */
const Loader: React.FC<ILoaderProps> = ({ label = 'Loading...', size = SpinnerSize.large }) => {
    return (
        <div className={styles.loaderContainer}>
            <Spinner size={size} label={label} ariaLive="assertive" />
        </div>
    );
};

export default Loader;

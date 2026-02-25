import * as React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';

export interface IErrorBoundaryProps {
    /** Optional fallback UI to render on error. If not provided, a default MessageBar is shown. */
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

interface IErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

/**
 * A React Error Boundary that catches rendering errors in child components
 * and displays a friendly fallback UI instead of crashing the whole webpart.
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary fallback={<div>Custom error message</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: IErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: '',
        };
    }

    public static getDerivedStateFromError(error: Error): IErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message || 'An unexpected error occurred.',
        };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log to console in development; replace with telemetry in production
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    public render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
                    Something went wrong: {this.state.errorMessage}
                </MessageBar>
            );
        }

        return this.props.children;
    }
}

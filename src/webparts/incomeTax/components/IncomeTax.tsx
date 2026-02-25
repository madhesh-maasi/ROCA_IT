import * as React from 'react';
import styles from './IncomeTax.module.scss';
import type { IIncomeTaxProps } from './IIncomeTaxProps';
import { escape } from '@microsoft/sp-lodash-subset';

// Importing from our new shared layers to demonstrate the pattern
import { ErrorBoundary, Loader } from '../../../common';
import { useAppSelector, useAppDispatch, selectIsLoading, selectError } from '../../../store';

/**
 * IncomeTax webpart root component (functional component).
 * Wrapped by Redux Provider in IncomeTaxWebPart.ts.
 */
const IncomeTax: React.FC<IIncomeTaxProps> = (props) => {
  const {
    description,
    isDarkTheme,
    environmentMessage,
    hasTeamsContext,
    userDisplayName,
  } = props;

  // Example: using Redux hooks (ready for when real data is implemented)
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  // Keep dispatch in scope so ESLint doesn't warn
  React.useEffect(() => {
    // Future: dispatch(fetchIncomeTaxItems({ getItems: service.getIncomeTaxItems }));
    console.log('IncomeTax component mounted. Redux dispatch is ready.', dispatch);
  }, [dispatch]);

  if (isLoading) {
    return <Loader label="Loading income tax data..." />;
  }

  return (
    <ErrorBoundary>
      <section className={`${styles.incomeTax} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={styles.welcome}>
          <img
            alt=""
            src={isDarkTheme ? require('../assets/welcome-dark.png') : require('../assets/welcome-light.png')}
            className={styles.welcomeImage}
          />
          <h2>Well done, {escape(userDisplayName)}!</h2>
          <div>{environmentMessage}</div>
          <div>Web part property value: <strong>{escape(description)}</strong></div>
        </div>

        {error && (
          <div style={{ color: 'red', padding: '8px' }}>
            Error: {error}
          </div>
        )}

        <div>
          <h3>Welcome to SharePoint Framework!</h3>
          <p>
            The SharePoint Framework (SPFx) is a extensibility model for Microsoft Viva, Microsoft Teams and SharePoint.
            It&#39;s the easiest way to extend Microsoft 365 with automatic Single Sign On, automatic hosting and industry standard tooling.
          </p>
          <h4>Learn more about SPFx development:</h4>
          <ul className={styles.links}>
            <li><a href="https://aka.ms/spfx" target="_blank" rel="noreferrer">SharePoint Framework Overview</a></li>
            <li><a href="https://aka.ms/spfx-yeoman-graph" target="_blank" rel="noreferrer">Use Microsoft Graph in your solution</a></li>
            <li><a href="https://aka.ms/spfx-yeoman-teams" target="_blank" rel="noreferrer">Build for Microsoft Teams using SharePoint Framework</a></li>
            <li><a href="https://aka.ms/spfx-yeoman-viva" target="_blank" rel="noreferrer">Build for Microsoft Viva Connections using SharePoint Framework</a></li>
            <li><a href="https://aka.ms/spfx-yeoman-store" target="_blank" rel="noreferrer">Publish SharePoint Framework applications to the marketplace</a></li>
            <li><a href="https://aka.ms/spfx-yeoman-api" target="_blank" rel="noreferrer">SharePoint Framework API reference</a></li>
            <li><a href="https://aka.ms/m365pnp" target="_blank" rel="noreferrer">Microsoft 365 Developer Community</a></li>
          </ul>
        </div>
      </section>
    </ErrorBoundary>
  );
};

export default IncomeTax;

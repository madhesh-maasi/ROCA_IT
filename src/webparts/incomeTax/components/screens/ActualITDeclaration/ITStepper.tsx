import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import styles from "./ITDeclaration.module.scss";

interface IStep {
  key: string;
  label: string;
  icon: any;
}

interface IITStepperProps {
  steps: IStep[];
  activeStep: string;
  onStepClick: (key: string) => void;
}

const ITStepper: React.FC<IITStepperProps> = ({
  steps,
  activeStep,
  onStepClick,
}) => {
  return (
    <div className={styles.stepperContainer}>
      <div className={styles.stepperLine} />
      {steps.map((step, index) => {
        const isActive = activeStep === step.key;
        return (
          <div
            key={step.key}
            className={`${styles.stepItem} ${isActive ? styles.active : ""}`}
            onClick={() => onStepClick(step.key)}
          >
            <div className={styles.iconCircle}>
              <HugeiconsIcon icon={step.icon} size={24} />
            </div>
            <span className={styles.stepLabel}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ITStepper;

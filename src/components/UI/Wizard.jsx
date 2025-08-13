import { useMapConfig } from '../../contexts/MapConfigContext';
import './Wizard.css';

const Wizard = ({ children }) => {
  const { currentStep, totalSteps, nextStep, prevStep } = useMapConfig();

  const canGoNext = () => {
    // Add validation logic here if needed
    return currentStep < totalSteps;
  };

  const canGoPrev = () => {
    return currentStep > 1;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Step 1: Select Location';
      case 2:
        return 'Step 2: Design Your Glass';
      case 3:
        return 'Step 3: 3D Preview';
      default:
        return `Step ${currentStep}`;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Choose your location and glass type';
      case 2:
        return 'Add text and icons to your map design';
      case 3:
        return 'See your design on a realistic 3D glass';
      default:
        return '';
    }
  };

  const getStepLabel = (stepIndex) => {
    switch (stepIndex) {
      case 1:
        return 'Location';
      case 2:
        return 'Design';
      case 3:
        return '3D Preview';
      default:
        return `Step ${stepIndex}`;
    }
  };

  return (
    <div className="wizard">
      {/* Progress Header */}
      <div className="wizard-header">
        <div className="step-info">
          <h1 className="step-title">{getStepTitle()}</h1>
          <p className="step-description">{getStepDescription()}</p>
        </div>
        
        <div className="progress-bar">
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index + 1}
                className={`progress-step ${
                  index + 1 === currentStep
                    ? 'active'
                    : index + 1 < currentStep
                    ? 'completed'
                    : 'upcoming'
                }`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-label">
                  {getStepLabel(index + 1)}
                </div>
              </div>
            ))}
          </div>
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        {children}
      </div>

      {/* Navigation Footer */}
      <div className="wizard-footer">
        <button
          className="wizard-btn wizard-btn-secondary"
          onClick={prevStep}
          disabled={!canGoPrev()}
        >
          ← Back
        </button>
        
        <div className="step-indicator">
          {currentStep} of {totalSteps}
        </div>

        <button
          className="wizard-btn wizard-btn-primary"
          onClick={nextStep}
          disabled={!canGoNext()}
        >
          {currentStep === totalSteps ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default Wizard;
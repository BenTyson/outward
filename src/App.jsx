import { MapConfigProvider, useMapConfig } from './contexts/MapConfigContext'
import Wizard from './components/UI/Wizard'
import Step1 from './components/Steps/Step1'
import Step2 from './components/Steps/Step2'
import TestMockup from './components/MockupGenerator/TestMockup'
import './App.css'

const AppContent = () => {
  const { currentStep } = useMapConfig();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <Wizard>
      {renderStep()}
    </Wizard>
  );
};

function App() {
  // Check URL parameter for test mode
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('test') === 'mockup';
  
  if (isTestMode) {
    return <TestMockup />;
  }
  
  return (
    <MapConfigProvider>
      <AppContent />
    </MapConfigProvider>
  )
}

export default App

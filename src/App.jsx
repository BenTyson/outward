import { MapConfigProvider, useMapConfig } from './contexts/MapConfigContext'
import Wizard from './components/UI/Wizard'
import Step1 from './components/Steps/Step1'
import Step2 from './components/Steps/Step2'
import Step3 from './components/Steps/Step3'
import TestMockup from './components/MockupGenerator/TestMockup'
import TestWrap from './components/MockupGenerator/TestWrap'
import TestTransform from './components/MockupGenerator/TestTransform'
import SimpleImageTest from './components/SimpleImageTest'
import CylinderMapTest from './components/CylinderTest/CylinderMapTest'
import './App.css'

const AppContent = () => {
  const { currentStep } = useMapConfig();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
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
  const testMode = urlParams.get('test');
  
  if (testMode === 'mockup') {
    return <TestMockup />;
  }
  
  if (testMode === 'wrap') {
    return <TestWrap />;
  }
  
  if (testMode === 'transform') {
    return <TestTransform />;
  }
  
  if (testMode === 'image') {
    return <SimpleImageTest />;
  }
  
  // 3D Cylinder Test - Currently configured for Rocks Glass only
  // Future: ?test=cylinder-pint, ?test=cylinder-wine, ?test=cylinder-shot
  if (testMode === 'cylinder') {
    return <CylinderMapTest />;
  }
  
  return (
    <MapConfigProvider>
      <AppContent />
    </MapConfigProvider>
  )
}

export default App

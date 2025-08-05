import { MapConfigProvider } from './contexts/MapConfigContext'
import GlassTypeSelector from './components/UI/GlassTypeSelector'
import MapSelector from './components/MapBuilder/MapSelector'
import MapRenderer from './components/MapBuilder/MapRenderer'
import TextOverlay from './components/MapBuilder/TextOverlay'
import CanvasComposer from './components/MapBuilder/CanvasComposer'
import './App.css'

function App() {
  return (
    <MapConfigProvider>
      <div className="app">
        <header className="app-header">
          <h1>LumenGrave Map Glass Configurator</h1>
          <p>Design your custom engraved glass map</p>
        </header>
        
        <main className="app-main">
          <div className="configurator-container">
            <section className="config-section">
              <GlassTypeSelector />
            </section>
            
            <section className="config-section">
              <h2>Select Location</h2>
              <MapSelector />
            </section>
            
            <section className="config-section">
              <h2>Map Preview</h2>
              <MapRenderer />
            </section>
            
            <section className="config-section">
              <h2>Add Text</h2>
              <TextOverlay />
            </section>
            
            <section className="config-section">
              <CanvasComposer />
            </section>
          </div>
        </main>
        
        <footer className="app-footer">
          <p>© 2024 LumenGrave - Custom Laser Engraving</p>
        </footer>
      </div>
    </MapConfigProvider>
  )
}

export default App

import { createContext, useContext, useReducer, useCallback } from 'react';
import { DEFAULT_LOCATION } from '../utils/coordinates';

const MapConfigContext = createContext();

const initialState = {
  location: DEFAULT_LOCATION,
  glassType: 'pint',
  texts: [],
  icons: [],
  mapImageUrl: null,
  previewImageUrl: null,
  modelPreviewAvailable: false, // Controls Step 3 visibility for 3D preview
  modelImageUrl: null, // Stores generated image for 3D model texture
  isLoading: false,
  error: null,
  currentStep: 1,
  totalSteps: 2 // Always 2 steps: 1=Location, 2=Design+3DPreview
};

const actionTypes = {
  SET_LOCATION: 'SET_LOCATION',
  SET_GLASS_TYPE: 'SET_GLASS_TYPE',
  ADD_TEXT: 'ADD_TEXT',
  UPDATE_TEXT: 'UPDATE_TEXT',
  REMOVE_TEXT: 'REMOVE_TEXT',
  ADD_ICON: 'ADD_ICON',
  UPDATE_ICON: 'UPDATE_ICON',
  REMOVE_ICON: 'REMOVE_ICON',
  SET_MAP_IMAGE: 'SET_MAP_IMAGE',
  SET_PREVIEW_IMAGE: 'SET_PREVIEW_IMAGE',
  SET_MODEL_PREVIEW_AVAILABLE: 'SET_MODEL_PREVIEW_AVAILABLE', // Enable/disable 3D preview
  SET_MODEL_IMAGE: 'SET_MODEL_IMAGE', // Store generated image for 3D model
  UPDATE_TOTAL_STEPS: 'UPDATE_TOTAL_STEPS', // Dynamic step count (2 vs 3)
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STEP: 'SET_STEP',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  RESET: 'RESET'
};

const mapConfigReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOCATION:
      return { ...state, location: action.payload };
    
    case actionTypes.SET_GLASS_TYPE:
      return { ...state, glassType: action.payload };
    
    case actionTypes.ADD_TEXT:
      return { 
        ...state, 
        texts: [...state.texts, { id: Date.now(), ...action.payload }]
      };
    
    case actionTypes.UPDATE_TEXT:
      return {
        ...state,
        texts: state.texts.map(text => 
          text.id === action.payload.id ? { ...text, ...action.payload } : text
        )
      };
    
    case actionTypes.REMOVE_TEXT:
      return {
        ...state,
        texts: state.texts.filter(text => text.id !== action.payload)
      };
    
    case actionTypes.ADD_ICON:
      return {
        ...state,
        icons: [...state.icons, { id: Date.now(), ...action.payload }]
      };
    
    case actionTypes.UPDATE_ICON:
      return {
        ...state,
        icons: state.icons.map(icon =>
          icon.id === action.payload.id ? { ...icon, ...action.payload } : icon
        )
      };
    
    case actionTypes.REMOVE_ICON:
      return {
        ...state,
        icons: state.icons.filter(icon => icon.id !== action.payload)
      };
    
    case actionTypes.SET_MAP_IMAGE:
      return { ...state, mapImageUrl: action.payload };
    
    case actionTypes.SET_PREVIEW_IMAGE:
      return { ...state, previewImageUrl: action.payload };
    
    case actionTypes.SET_MODEL_PREVIEW_AVAILABLE:
      return { ...state, modelPreviewAvailable: action.payload };
    
    case actionTypes.SET_MODEL_IMAGE:
      return { ...state, modelImageUrl: action.payload };
    
    case actionTypes.UPDATE_TOTAL_STEPS:
      return { ...state, totalSteps: action.payload };
    
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case actionTypes.SET_STEP:
      return { ...state, currentStep: action.payload };
    
    case actionTypes.NEXT_STEP:
      return { 
        ...state, 
        currentStep: Math.min(state.currentStep + 1, state.totalSteps) 
      };
    
    case actionTypes.PREV_STEP:
      return { 
        ...state, 
        currentStep: Math.max(state.currentStep - 1, 1) 
      };
    
    case actionTypes.RESET:
      return initialState;
    
    default:
      return state;
  }
};

export const MapConfigProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mapConfigReducer, initialState);
  
  const setLocation = useCallback((location) => {
    dispatch({ type: actionTypes.SET_LOCATION, payload: location });
  }, []);
  
  const setGlassType = useCallback((glassType) => {
    dispatch({ type: actionTypes.SET_GLASS_TYPE, payload: glassType });
  }, []);
  
  const addText = useCallback((text) => {
    dispatch({ type: actionTypes.ADD_TEXT, payload: text });
  }, []);
  
  const updateText = useCallback((id, updates) => {
    dispatch({ type: actionTypes.UPDATE_TEXT, payload: { id, ...updates } });
  }, []);
  
  const removeText = useCallback((id) => {
    dispatch({ type: actionTypes.REMOVE_TEXT, payload: id });
  }, []);
  
  const addIcon = useCallback((icon) => {
    dispatch({ type: actionTypes.ADD_ICON, payload: icon });
  }, []);
  
  const updateIcon = useCallback((id, updates) => {
    dispatch({ type: actionTypes.UPDATE_ICON, payload: { id, ...updates } });
  }, []);
  
  const removeIcon = useCallback((id) => {
    dispatch({ type: actionTypes.REMOVE_ICON, payload: id });
  }, []);
  
  const setMapImage = useCallback((url) => {
    dispatch({ type: actionTypes.SET_MAP_IMAGE, payload: url });
  }, []);
  
  const setPreviewImage = useCallback((url) => {
    dispatch({ type: actionTypes.SET_PREVIEW_IMAGE, payload: url });
  }, []);
  
  const setModelPreviewAvailable = useCallback((available) => {
    dispatch({ type: actionTypes.SET_MODEL_PREVIEW_AVAILABLE, payload: available });
  }, []);
  
  const setModelImage = useCallback((url) => {
    dispatch({ type: actionTypes.SET_MODEL_IMAGE, payload: url });
  }, []);
  
  const updateTotalSteps = useCallback((steps) => {
    dispatch({ type: actionTypes.UPDATE_TOTAL_STEPS, payload: steps });
  }, []);
  
  const setLoading = useCallback((isLoading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: isLoading });
  }, []);
  
  const setError = useCallback((error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
  }, []);
  
  const setStep = useCallback((step) => {
    dispatch({ type: actionTypes.SET_STEP, payload: step });
  }, []);
  
  const nextStep = useCallback(() => {
    dispatch({ type: actionTypes.NEXT_STEP });
  }, []);
  
  const prevStep = useCallback(() => {
    dispatch({ type: actionTypes.PREV_STEP });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: actionTypes.RESET });
  }, []);
  
  const value = {
    ...state,
    setLocation,
    setGlassType,
    addText,
    updateText,
    removeText,
    addIcon,
    updateIcon,
    removeIcon,
    setMapImage,
    setPreviewImage,
    setModelPreviewAvailable,
    setModelImage,
    updateTotalSteps,
    setLoading,
    setError,
    setStep,
    nextStep,
    prevStep,
    reset
  };
  
  return (
    <MapConfigContext.Provider value={value}>
      {children}
    </MapConfigContext.Provider>
  );
};

export const useMapConfig = () => {
  const context = useContext(MapConfigContext);
  if (!context) {
    throw new Error('useMapConfig must be used within MapConfigProvider');
  }
  return context;
};
import { createContext, useContext, useReducer, useCallback } from 'react';
import { DEFAULT_LOCATION } from '../utils/coordinates';

const MapConfigContext = createContext();

const initialState = {
  location: DEFAULT_LOCATION,
  coordinates: null, // {lat, lng}
  zoom: 12,
  glassType: 'pint',
  texts: [],
  icons: [],
  mapImageUrl: null,
  previewImageUrl: null,
  highResImage: null, // High-resolution image for laser engraving
  previewImage: null, // Preview image for display
  modelPreviewAvailable: false, // Controls Step 3 visibility for 3D preview
  modelImageUrl: null, // Stores generated image for 3D model texture
  isLoading: false,
  error: null,
  currentStep: 1,
  totalSteps: 2, // Always 2 steps: 1=Location, 2=Design+3DPreview
  
  // Phase D: Checkout Flow State
  designComplete: false,      // Map + text generation done
  model3dComplete: false,     // 3D render complete  
  finishEnabled: false,       // Both above = true
  generatedImages: {
    preview: null,            // Canvas data URL (800px)
    model3d: null,            // 3D canvas capture
    highres: null,            // High resolution canvas (4800px)
    thumbnail: null           // Scaled down version (200px)
  },
  uploadingImages: false,     // Upload in progress
  uploadedImageUrls: null,    // Shopify CDN URLs after upload
  uploadError: null           // Upload error message
};

const actionTypes = {
  SET_LOCATION: 'SET_LOCATION',
  SET_COORDINATES: 'SET_COORDINATES',
  SET_ZOOM: 'SET_ZOOM',
  SET_GLASS_TYPE: 'SET_GLASS_TYPE',
  ADD_TEXT: 'ADD_TEXT',
  UPDATE_TEXT: 'UPDATE_TEXT',
  REMOVE_TEXT: 'REMOVE_TEXT',
  ADD_ICON: 'ADD_ICON',
  UPDATE_ICON: 'UPDATE_ICON',
  REMOVE_ICON: 'REMOVE_ICON',
  SET_MAP_IMAGE: 'SET_MAP_IMAGE',
  SET_PREVIEW_IMAGE: 'SET_PREVIEW_IMAGE',
  SET_HIGH_RES_IMAGE: 'SET_HIGH_RES_IMAGE',
  SET_MODEL_PREVIEW_AVAILABLE: 'SET_MODEL_PREVIEW_AVAILABLE', // Enable/disable 3D preview
  SET_MODEL_IMAGE: 'SET_MODEL_IMAGE', // Store generated image for 3D model
  UPDATE_TOTAL_STEPS: 'UPDATE_TOTAL_STEPS', // Dynamic step count (2 vs 3)
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STEP: 'SET_STEP',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  RESET: 'RESET',
  
  // Phase D: Checkout Flow Actions
  SET_DESIGN_COMPLETE: 'SET_DESIGN_COMPLETE',
  SET_MODEL3D_COMPLETE: 'SET_MODEL3D_COMPLETE', 
  SET_FINISH_ENABLED: 'SET_FINISH_ENABLED',
  SET_GENERATED_IMAGES: 'SET_GENERATED_IMAGES',
  UPDATE_GENERATED_IMAGE: 'UPDATE_GENERATED_IMAGE',
  SET_UPLOADING_IMAGES: 'SET_UPLOADING_IMAGES',
  SET_UPLOADED_IMAGE_URLS: 'SET_UPLOADED_IMAGE_URLS',
  SET_UPLOAD_ERROR: 'SET_UPLOAD_ERROR'
};

const mapConfigReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOCATION:
      return { ...state, location: action.payload };
    
    case actionTypes.SET_COORDINATES:
      return { ...state, coordinates: action.payload };
    
    case actionTypes.SET_ZOOM:
      return { ...state, zoom: action.payload };
    
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
      return { ...state, previewImageUrl: action.payload, previewImage: action.payload };
    
    case actionTypes.SET_HIGH_RES_IMAGE:
      return { ...state, highResImage: action.payload };
    
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
    
    // Phase D: Checkout Flow Reducers
    case actionTypes.SET_DESIGN_COMPLETE:
      return { ...state, designComplete: action.payload };
    
    case actionTypes.SET_MODEL3D_COMPLETE:
      return { ...state, model3dComplete: action.payload };
    
    case actionTypes.SET_FINISH_ENABLED:
      return { ...state, finishEnabled: action.payload };
    
    case actionTypes.SET_GENERATED_IMAGES:
      return { ...state, generatedImages: action.payload };
    
    case actionTypes.UPDATE_GENERATED_IMAGE:
      return { 
        ...state, 
        generatedImages: { 
          ...state.generatedImages, 
          [action.payload.type]: action.payload.dataUrl 
        }
      };
    
    case actionTypes.SET_UPLOADING_IMAGES:
      return { ...state, uploadingImages: action.payload };
    
    case actionTypes.SET_UPLOADED_IMAGE_URLS:
      return { ...state, uploadedImageUrls: action.payload };
    
    case actionTypes.SET_UPLOAD_ERROR:
      return { ...state, uploadError: action.payload };
    
    default:
      return state;
  }
};

export const MapConfigProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mapConfigReducer, initialState);
  
  const setLocation = useCallback((location) => {
    dispatch({ type: actionTypes.SET_LOCATION, payload: location });
  }, []);
  
  const setCoordinates = useCallback((coordinates) => {
    dispatch({ type: actionTypes.SET_COORDINATES, payload: coordinates });
  }, []);
  
  const setZoom = useCallback((zoom) => {
    dispatch({ type: actionTypes.SET_ZOOM, payload: zoom });
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
  
  const setHighResImage = useCallback((url) => {
    dispatch({ type: actionTypes.SET_HIGH_RES_IMAGE, payload: url });
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

  // Phase D: Checkout Flow Actions
  const setDesignComplete = useCallback((complete) => {
    dispatch({ type: actionTypes.SET_DESIGN_COMPLETE, payload: complete });
  }, []);

  const setModel3dComplete = useCallback((complete) => {
    dispatch({ type: actionTypes.SET_MODEL3D_COMPLETE, payload: complete });
  }, []);

  const setFinishEnabled = useCallback((enabled) => {
    dispatch({ type: actionTypes.SET_FINISH_ENABLED, payload: enabled });
  }, []);

  const setGeneratedImages = useCallback((images) => {
    dispatch({ type: actionTypes.SET_GENERATED_IMAGES, payload: images });
  }, []);

  const updateGeneratedImage = useCallback((type, dataUrl) => {
    dispatch({ type: actionTypes.UPDATE_GENERATED_IMAGE, payload: { type, dataUrl } });
  }, []);

  const setUploadingImages = useCallback((uploading) => {
    dispatch({ type: actionTypes.SET_UPLOADING_IMAGES, payload: uploading });
  }, []);

  const setUploadedImageUrls = useCallback((urls) => {
    dispatch({ type: actionTypes.SET_UPLOADED_IMAGE_URLS, payload: urls });
  }, []);

  const setUploadError = useCallback((error) => {
    dispatch({ type: actionTypes.SET_UPLOAD_ERROR, payload: error });
  }, []);
  
  const value = {
    ...state,
    setLocation,
    setCoordinates,
    setZoom,
    setGlassType,
    addText,
    updateText,
    removeText,
    addIcon,
    updateIcon,
    removeIcon,
    setMapImage,
    setPreviewImage,
    setHighResImage,
    setModelPreviewAvailable,
    setModelImage,
    updateTotalSteps,
    setLoading,
    setError,
    setStep,
    nextStep,
    prevStep,
    reset,
    // Phase D: Checkout Flow Actions
    setDesignComplete,
    setModel3dComplete,
    setFinishEnabled,
    setGeneratedImages,
    updateGeneratedImage,
    setUploadingImages,
    setUploadedImageUrls,
    setUploadError,
    // Computed values for convenience
    text1: state.texts[0]?.text || '',
    text2: state.texts[1]?.text || ''
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
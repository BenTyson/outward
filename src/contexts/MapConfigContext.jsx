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
  isLoading: false,
  error: null
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
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
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
    
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
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
  
  const setLoading = useCallback((isLoading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: isLoading });
  }, []);
  
  const setError = useCallback((error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
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
    setLoading,
    setError,
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
# Claude Code Agent Instructions

## Project Context
You are building a custom map glass configurator for LumenGrave, a laser engraving business. The system allows customers to select locations, customize text overlays, preview designs on 3D glass models, and purchase through Shopify checkout.

## Development Approach

### Build Philosophy
- **Quality over speed**: Prioritize working, tested code over rapid prototyping
- **Mobile-first**: All features must work smoothly on mobile devices
- **Performance conscious**: Optimize for mid-range mobile devices
- **User experience focused**: Intuitive, polished interactions throughout

### Code Standards
- **Modern React**: Use functional components with hooks, no class components
- **TypeScript optional**: Use if beneficial, but not required
- **Clean architecture**: Separate concerns, reusable components
- **Error handling**: Comprehensive error boundaries and user feedback
- **Responsive design**: Mobile-first CSS with desktop enhancements

## Technical Stack

### Core Technologies
- **Frontend Framework**: React 18+ with Vite
- **3D Graphics**: Three.js with React Three Fiber
- **Maps**: Mapbox GL JS + Static Images API
- **Styling**: CSS Modules or Styled Components (your choice)
- **State Management**: React Context + useReducer (avoid external state libraries initially)

### Performance Requirements
- **Initial Load**: < 3 seconds on 3G mobile
- **3D Model Loading**: Progressive with loading states
- **Map Rendering**: Smooth pan/zoom on mobile
- **Memory Usage**: No memory leaks in 3D scenes

## Phase-Specific Guidance

### Phase 1: Map Builder
**Priority**: Core functionality over visual polish initially
- Start with basic map selection and location search
- Implement text overlay system early
- Ensure aspect ratio calculations are precise
- Test high-resolution export thoroughly
- Mobile touch interactions are critical

### Phase 2: 3D Mockup Generator
**Priority**: Model loading and basic materials first
- Begin with simple geometry if complex models fail
- Glass materials can start basic and be enhanced later
- UV mapping precision is crucial - test thoroughly
- Performance optimization is essential for mobile
- Implement fallbacks for WebGL issues

### Phase 3: Shopify Integration
**Priority**: Reliable cart integration over advanced features
- Focus on solid PostMessage communication
- Ensure order properties are correctly formatted
- Test webhook processing extensively
- Maintain existing store functionality
- Document integration points clearly

## Development Workflow

### Testing Strategy
- **Component Testing**: Test each component in isolation
- **Integration Testing**: Test phase handoffs thoroughly
- **Device Testing**: Test on actual mobile devices when possible
- **User Flow Testing**: Complete end-to-end workflows
- **Performance Testing**: Monitor bundle sizes and render times

### Error Handling Approach
- **Graceful Degradation**: System should work with limited features if something fails
- **User Feedback**: Clear error messages with actionable guidance
- **Fallback Options**: Alternative approaches when primary methods fail
- **Logging**: Console errors for debugging, user-friendly messages for UI

### File Organization
- **Component Co-location**: Keep related files together
- **Clear Naming**: Descriptive file and function names
- **Logical Grouping**: Group by feature, not by file type
- **Documentation**: Brief comments for complex logic
- **Export Clarity**: Clear default and named exports

## Code Quality Guidelines

### React Patterns
```javascript
// Prefer this pattern
const Component = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return <div>{/* JSX */}</div>;
};

// Avoid overly complex useEffect dependencies
// Prefer multiple focused useEffects over one complex one
```

### Error Boundaries
```javascript
// Implement error boundaries for 3D components
const ThreeJSErrorBoundary = ({ children }) => {
  // Handle WebGL and Three.js specific errors
};
```

### Performance Patterns
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ prop }) => {
  // Component logic
});

// Lazy load heavy components
const ThreeScene = lazy(() => import('./ThreeScene'));
```

## Problem-Solving Approach

### When Stuck
1. **Break down the problem**: Identify the smallest working piece
2. **Check documentation**: Mapbox, Three.js, and React docs are comprehensive
3. **Start simple**: Get basic functionality working before adding complexity
4. **Test incrementally**: Don't build large features without testing smaller parts
5. **Ask for clarification**: If requirements are unclear, ask specific questions

### Common Pitfalls to Avoid
- **Over-engineering**: Don't build features not in the spec
- **Premature optimization**: Get it working first, optimize later
- **Ignoring mobile**: Desktop-only solutions won't work
- **Memory leaks**: Especially important with Three.js scenes
- **Async race conditions**: Properly handle loading states and cleanup

### Debugging Strategies
- **Console logging**: Use meaningful log messages for complex flows
- **React DevTools**: Essential for component debugging
- **Browser DevTools**: Network tab for API issues, Performance tab for optimization
- **Mobile debugging**: Use remote debugging for mobile-specific issues

## Communication Guidelines

### Progress Updates
- **Frequent commits**: Small, focused commits with clear messages
- **Document decisions**: Brief comments explaining complex choices
- **Highlight blockers**: Call out when you need external resources (3D models, API keys, etc.)
- **Test results**: Share what's working and what needs attention

### When to Ask Questions
- **Unclear requirements**: Don't assume - ask for clarification
- **Missing resources**: When you need files, API keys, or access
- **Technical blockers**: When stuck after reasonable troubleshooting
- **Design decisions**: When multiple valid approaches exist

## Resource Management

### External Dependencies
- **Minimize bundle size**: Only import what you need from libraries
- **CDN when appropriate**: For heavy assets like 3D models
- **Lazy loading**: For non-critical components
- **Tree shaking**: Ensure build tools eliminate unused code

### API Usage
- **Rate limiting**: Respect Mapbox API limits
- **Caching**: Cache map tiles and static resources
- **Error handling**: Handle API failures gracefully
- **Environment variables**: Use proper config management

## Success Metrics

### Definition of Done (Per Component)
- [ ] Functionality works as specified
- [ ] Mobile experience is smooth
- [ ] Error handling is implemented
- [ ] Performance is acceptable
- [ ] Code is clean and documented
- [ ] Component is tested in isolation

### Phase Completion Criteria
- [ ] All success criteria from phase spec are met
- [ ] Integration points are clean and documented
- [ ] Performance benchmarks are achieved
- [ ] Mobile experience is polished
- [ ] Error handling covers edge cases

---

## Quick Reference

### Essential Commands
```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint/format (if configured)
npm run lint
npm run format
```

### Key File Locations
- **Environment variables**: `.env.local`
- **Configuration**: `vite.config.js`
- **Main entry**: `src/main.jsx`
- **Global styles**: `src/index.css`

### Important URLs
- **Mapbox Documentation**: https://docs.mapbox.com/
- **Three.js Documentation**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Shopify Storefront API**: https://shopify.dev/docs/api/storefront

---

*Focus on building one phase completely before moving to the next. Quality implementations that work reliably are more valuable than feature-complete but buggy systems.*
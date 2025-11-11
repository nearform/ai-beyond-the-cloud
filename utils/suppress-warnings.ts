/**
 * Suppress specific console warnings that are expected and not actionable.
 * This is done by intercepting console.warn calls and filtering out known warnings.
 */

import { LogBox } from 'react-native';

const SUPPRESSED_WARNINGS = [
  'No content-length header',
  'onAnimatedValueUpdate',
] as const;

// Native iOS warnings to suppress via LogBox (string patterns)
const SUPPRESSED_NATIVE_WARNINGS = [
  'CHHapticPattern',
  'hapticpatternlibrary.plist',
  '_UIKBFeedbackGenerator',
  'CoreHaptics',
] as const;

/**
 * Initialize warning suppression.
 * Should be called early in the app lifecycle, before any components render.
 */
export function suppressWarnings() {
  // Suppress JavaScript console warnings
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this warning should be suppressed
    const shouldSuppress = SUPPRESSED_WARNINGS.some(pattern => 
      message.includes(pattern)
    ) || SUPPRESSED_NATIVE_WARNINGS.some(pattern =>
      message.includes(pattern)
    );
    
    if (shouldSuppress) {
      return; // Silently ignore
    }
    
    // Otherwise, call the original warn function
    originalWarn.apply(console, args);
  };

  // Also filter console.error for native haptic warnings
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Suppress haptic-related errors
    const shouldSuppress = SUPPRESSED_NATIVE_WARNINGS.some(pattern =>
      message.includes(pattern)
    );
    
    if (shouldSuppress) {
      return; // Silently ignore
    }
    
    // Otherwise, call the original error function
    originalError.apply(console, args);
  };

  // Suppress native iOS warnings via LogBox
  SUPPRESSED_NATIVE_WARNINGS.forEach(pattern => {
    LogBox.ignoreLogs([pattern]);
  });
}




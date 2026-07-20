// Haptic Feedback Utility using Web Vibration API

export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'pop' = 'light') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (pattern) {
      case 'light':
      case 'pop':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'success':
        navigator.vibrate([15, 40, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30]);
        break;
      case 'error':
        navigator.vibrate([40, 60, 40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (e) {
    // Ignore vibration restrictions if blocked by browser policy
  }
};

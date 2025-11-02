import { useState, useEffect } from 'react';
import { UpdateNotification } from './UpdateNotification'; // Ensure this points to your updated component
import { createPortal } from 'react-dom';

/**
 * Manages the display of the service worker update notification.
 * It listens for a custom event indicating a new service worker is ready (waiting).
 */
export function UpdateNotificationManager() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // 1. Check if the user dismissed the notification in the current session
    const isDismissed = sessionStorage.getItem('updateDismissed') === 'true';
    if (isDismissed) {
      // If dismissed, we don't need to listen for the event this session.
      return; 
    }

    // 2. Listener for custom event from service worker registration (e.g., from a custom registration logic)
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceWorker>;
      setWaitingWorker(customEvent.detail);
      setShowUpdate(true);
    };

    window.addEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);

    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
    };
  }, []); // Run only once on mount

  const handleUpdate = () => {
    // 1. Hide the notification
    setShowUpdate(false);
    
    // 2. Send the message to activate the new worker
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      // This is a common pattern to force the new worker to take control.
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // The page will typically reload automatically shortly after 
      // the worker takes control, refreshing the page with the new code.
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Store dismissal in sessionStorage so it doesn't show again this session
    sessionStorage.setItem('updateDismissed', 'true');
  };

  if (!showUpdate) return null;

  // Render notification at document.body level using portal
  return createPortal(
    <UpdateNotification 
      onUpdate={handleUpdate} 
      onDismiss={handleDismiss} 
    />,
    document.body
  );
}
// Utility functions for handling and formatting error messages

export function parseErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred";
  
  // If error is a string, try to parse it
  if (typeof error === 'string') {
    try {
      // Handle cases like "403: {'error':'You are blocked by this user'}"
      const statusMatch = error.match(/^\d+:\s*(.+)$/);
      if (statusMatch) {
        const errorPart = statusMatch[1];
        try {
          const parsed = JSON.parse(errorPart);
          if (parsed.error) {
            return formatUserFriendlyError(parsed.error);
          }
        } catch {
          // If JSON parsing fails, try to extract error from string
          const errorMatch = errorPart.match(/'error':\s*'([^']+)'/);
          if (errorMatch) {
            return formatUserFriendlyError(errorMatch[1]);
          }
        }
        return formatUserFriendlyError(errorPart);
      }
      return formatUserFriendlyError(error);
    } catch {
      return formatUserFriendlyError(error);
    }
  }
  
  // If error is an object
  if (error.message) {
    return parseErrorMessage(error.message);
  }
  
  if (error.error) {
    return formatUserFriendlyError(error.error);
  }
  
  return "An unexpected error occurred";
}

function formatUserFriendlyError(errorMessage: string): string {
  // Common error message mappings
  const errorMappings: Record<string, string> = {
    "You are blocked by this user": "This user has blocked you and you cannot send messages to them.",
    "Target user connection not found": "Your friend is offline. You can send messages when they are online.",
    "User not found": "This user could not be found.",
    "Not authenticated": "Please log in to continue.",
    "Access denied": "You don't have permission to perform this action.",
    "Invalid request": "The request is invalid. Please try again.",
    "Server error": "Something went wrong on our end. Please try again later.",
    "Network error": "Please check your internet connection and try again.",
    "Unauthorized": "You are not authorized to perform this action.",
    "Forbidden": "This action is not allowed.",
    "Not found": "The requested resource could not be found.",
    "Conflict": "This action conflicts with the current state.",
    "Too many requests": "Too many requests. Please wait a moment and try again.",
    "Service unavailable": "The service is temporarily unavailable. Please try again later."
  };
  
  // Check for exact matches first
  if (errorMappings[errorMessage]) {
    return errorMappings[errorMessage];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Handle common HTTP status codes
  if (errorMessage.includes('400')) {
    return "The request is invalid. Please check your input and try again.";
  }
  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return "You are not authorized to perform this action.";
  }
  if (errorMessage.includes('404')) {
    return "The requested resource could not be found.";
  }
  if (errorMessage.includes('409')) {
    return "This action conflicts with the current state.";
  }
  if (errorMessage.includes('429')) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (errorMessage.includes('500')) {
    return "Something went wrong on our end. Please try again later.";
  }
  if (errorMessage.includes('503')) {
    return "The service is temporarily unavailable. Please try again later.";
  }
  
  // Clean up technical error messages
  const cleanedMessage = errorMessage
    .replace(/^\d+:\s*/, '') // Remove status codes
    .replace(/^Error:\s*/, '') // Remove "Error:" prefix
    .replace(/\{[^}]*\}/g, '') // Remove JSON objects
    .replace(/["']/g, '') // Remove quotes
    .trim();
  
  // If the cleaned message is empty or too technical, provide a generic message
  if (!cleanedMessage || cleanedMessage.length < 5 || containsTechnicalTerms(cleanedMessage)) {
    return "An error occurred. Please try again.";
  }
  
  // Capitalize first letter
  return cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1);
}

function containsTechnicalTerms(message: string): boolean {
  const technicalTerms = [
    'http', 'api', 'json', 'sql', 'database', 'server', 'client',
    'request', 'response', 'status', 'code', 'stack', 'trace',
    'function', 'method', 'object', 'array', 'null', 'undefined'
  ];
  
  const lowerMessage = message.toLowerCase();
  return technicalTerms.some(term => lowerMessage.includes(term));
}

export function showUserFriendlyError(error: any, toast: any) {
  const friendlyMessage = parseErrorMessage(error);
  
  toast({
    title: "Error",
    description: friendlyMessage,
    variant: "destructive",
  });
}
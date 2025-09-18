import { useEffect } from "react";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function AuthRedirectHandler() {
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in
          const credential = GoogleAuthProvider.credentialFromResult(result);
          console.log("User signed in:", result.user);
        }
      } catch (error) {
        console.error("Error during redirect:", error);
      }
    };

    handleRedirect();
  }, []);

  return null;
}
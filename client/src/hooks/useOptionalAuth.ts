import { useAuth } from "react-oidc-context";

export const useOptionalAuth = () => {
    try {
        return useAuth();
    } catch {
        return null;
    }
};

export default useOptionalAuth;
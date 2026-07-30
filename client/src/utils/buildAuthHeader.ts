import type { AuthContextProps } from "react-oidc-context";

const buildAuthHeader = (auth: AuthContextProps | undefined | null): string => {
    if (!auth) {
        return "";
    }

    if (!auth.user) {
        return "";
    }
    const header = `Bearer ${auth.user.access_token}`;
    return header
}

export default buildAuthHeader;
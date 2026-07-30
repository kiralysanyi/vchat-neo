import type { AuthContextProps } from "react-oidc-context";

const buildAuthHeader = (auth: AuthContextProps | undefined | null): string => {
    if (!auth) {
        return "";
    }

    if (!auth.user) {
        return "";
    }

    return `Bearer ${auth.user.access_token}`
}

export default buildAuthHeader;
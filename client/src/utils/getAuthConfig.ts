import config from "../config";
import type { AuthConfig } from "../types/AuthConfig";

const getAuthConfig = async (): Promise<AuthConfig | null> => {
    const response = await fetch(`${config.serverUrl}/api/auth/config`, { method: "GET", headers: { "Content-Type": "application/json" } });
    if (response.status == 404) {
        return null;
    }

    const parsed: AuthConfig = await response.json();

    return parsed;
}

export default getAuthConfig;
import { useEffect, useState } from "react";
import type { AuthConfig } from "../types/AuthConfig";
import { useAuth } from "react-oidc-context";

const useRoleManager = () => {
    const [canCreate, setCanCreate] = useState(true)
    const [canManage, setCanManage] = useState(false);
    const auth = useAuth();

    useEffect(() => {
        const saved = sessionStorage.getItem("authconfig");
        if (saved == null) {
            return
        }
        const authconfig: AuthConfig = JSON.parse(saved);
        if (authconfig.zitadel_use_roles == true) {
            const rolesClaim = auth.user?.profile?.['urn:zitadel:iam:org:project:roles'] as Record<string, unknown> | undefined;
            const roles = rolesClaim ? Object.keys(rolesClaim) : [];

            setCanCreate(roles.includes("meet_create"))
            setCanManage(roles.includes("management"))
        }

    }, [])

    return { canCreate, canManage }
}

export default useRoleManager;
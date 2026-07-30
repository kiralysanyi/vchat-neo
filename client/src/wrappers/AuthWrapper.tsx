import { useEffect, type PropsWithChildren } from "react";
import { useAuth } from "react-oidc-context";
import socket from "../socket";

const AuthWrapper = ({ children }: PropsWithChildren) => {
    const auth = useAuth();

    useEffect(() => {
        if (location.pathname == "/callback") {
            return;
        }
        sessionStorage.setItem("aftercb", location.pathname)
    }, [])

    useEffect(() => {
        if (auth.isAuthenticated) {
            socket.emit("token", auth.user?.access_token)
        }
    }, [auth.isAuthenticated])

    switch (auth.activeNavigator) {
        case "signinSilent":
            return <div>Signing you in...</div>;
        case "signoutRedirect":
            return <div>Signing you out...</div>;
    }

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    if (auth.error) {
        return <div>Oops... {auth.error.source} caused {auth.error.message}</div>;
    }

    if (auth.isAuthenticated) {
        return children
        // <div>
        //     Hello {auth.user?.profile.sub}{" "}
        //     <button onClick={() => void auth.removeUser()}>Log out</button>
        // </div>
    }

    return <button onClick={() => void auth.signinRedirect()}>Log in</button>;
}

export default AuthWrapper;
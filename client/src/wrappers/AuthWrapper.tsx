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

    return <div className="page">
        <div className="mx-auto my-auto flex flex-col gap-8 p-4">
            <h1>Auth required</h1>
            <p>This server uses authentication. Please sign in or register a new account!</p>
            <p>Auth server: <b>{new URL(auth.settings.authority).hostname}</b></p>
            <button onClick={() => void auth.signinRedirect()}>Log in / Register</button>
        </div>
    </div>
}

export default AuthWrapper;
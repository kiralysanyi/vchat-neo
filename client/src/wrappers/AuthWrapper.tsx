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
            return <div className="page">
                <div className="mx-auto my-auto flex flex-col">
                    <span>Signing you in</span>
                    <div className="loader"></div>
                </div>
            </div>;
        case "signoutRedirect":
            return <div className="page">
                <div className="mx-auto my-auto flex flex-col">
                    <span>Signing you out</span>
                    <div className="loader"></div>
                </div>
            </div>;
    }

    if (auth.isLoading) {
        return <div className="page">
            <div className="mx-auto my-auto flex flex-col">
                <span>Loading</span>
                <div className="loader"></div>
            </div>
        </div>;
    }

    if (auth.error) {
        return <div className="page">
            <div className="mx-auto my-auto flex flex-col">
                <h1>Auth error</h1>
                <span>Oops... {auth.error.source} caused {auth.error.message}</span>
            </div>
        </div>;
    }

    if (auth.isAuthenticated) {
        return children
    }

    return <div className="page">
        <div className="mx-auto my-auto flex flex-col gap-8 p-4">
            <h1>Auth required</h1>
            <p>This server uses authentication. Please sign in or register a new account!</p>
            <p>Auth server: <b><a target="blank" href={auth.settings.authority}>{new URL(auth.settings.authority).hostname}</a></b></p>
            <button onClick={() => void auth.signinRedirect()}>Log in / Register</button>
        </div>
    </div>
}

export default AuthWrapper;
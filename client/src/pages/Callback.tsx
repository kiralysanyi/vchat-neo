import { useEffect } from "react";
import { useNavigate } from "react-router";

const Callback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const nav = sessionStorage.getItem("aftercb");
        sessionStorage.removeItem("aftercb");
        console.log("Navto:", nav)
        navigate(nav ? nav : "/", { viewTransition: true })
    }, [])

    return <div className="page">
        <div className="my-auto mx-auto flex flex-col">
            <span>Processing</span>
            <div className="loader"></div>
        </div>
    </div>
}

export default Callback;
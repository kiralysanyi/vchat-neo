import { useEffect } from "react";
import { useNavigate } from "react-router";

const Callback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const nav = sessionStorage.getItem("aftercb");
        sessionStorage.removeItem("aftercb");
        console.log("Navto:", nav)
        navigate(nav ? nav : "/")
    }, [])

    return <>
        <h1>Processing...</h1>
    </>
}

export default Callback;
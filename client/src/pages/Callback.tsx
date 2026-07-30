import { useEffect } from "react";
import { useNavigate } from "react-router";

const Callback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/")
    }, [])

    return <>
        <h1>Processing...</h1>
    </>
}

export default Callback;
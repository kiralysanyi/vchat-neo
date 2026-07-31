import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import useRoleManager from "../hooks/useRoleManager";

const Index = () => {
    const auth = useAuth();

    const [id, setId] = useState("");
    const [inputsDisabled, setInputsDisabled] = useState(false)
    const navigate = useNavigate();

    const [error, setError] = useState<string>()

    const { canCreate } = useRoleManager();


    document.title = "VChat-Neo"

    const joinOrCreate = () => {
        setInputsDisabled(true);

        if (id == "join" || /[^\w-]/.test(id)) {
            setInputsDisabled(false);
            return setError("Invalid id");
        }

        if (id.length < 5) {
            setInputsDisabled(false);
            return setError("Id has to be at least 5 characters");
        }

        navigate("/meeting/join/" + id)
    }

    return <div className="page">
        <div className="mx-auto my-auto flex flex-col gap-8 p-4">
            <h1>Join{canCreate?"/Create":""} Meeting</h1>
            {error && <span className="bg-red-800 p-2">{error}</span>}
            <div className="form-group">
                <label htmlFor="id">Meeting id</label>
                <input autoComplete="off" disabled={inputsDisabled} value={id} onChange={(ev) => { setId(ev.target.value) }} type="text" placeholder="ID" />
            </div>
            <button disabled={inputsDisabled} onClick={joinOrCreate}>Join{canCreate?"/Create":""}</button>
            {(window as any).authenabled ? <button onClick={() => void auth?.removeUser()}>Log out</button> : ""}
        </div>
    </div>
}

export default Index;
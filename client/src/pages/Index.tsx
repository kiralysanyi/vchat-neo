import { useState } from "react";
import { useNavigate } from "react-router";

const Index = () => {
    const [id, setId] = useState("");
    const [inputsDisabled, setInputsDisabled] = useState(false)
    const navigate = useNavigate();

    document.title = "VChat-Neo"

    const joinOrCreate = () => {
        setInputsDisabled(true);

        navigate("/meeting/join/" + id)
    }

    return <div className="page">
        <div className="mx-auto my-auto flex flex-col gap-8 p-4">
            <h1>Join/Create Meeting</h1>
            <div className="form-group">
                <label htmlFor="id">Meeting id</label>
                <input autoComplete="off" disabled={inputsDisabled} value={id} onChange={(ev) => { setId(ev.target.value) }} type="text" placeholder="ID" />
            </div>
            <button disabled={inputsDisabled} onClick={joinOrCreate}>Join/Create</button>
        </div>
    </div>
}

export default Index;
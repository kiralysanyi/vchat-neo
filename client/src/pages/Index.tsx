import { useState } from "react";
import config from "../config";
import { useNavigate } from "react-router";

const Index = () => {
    const [id, setId] = useState("");
    const [inputsDisabled, setInputsDisabled] = useState(false)
    const navigate = useNavigate();

    const joinOrCreate = () => {
        setInputsDisabled(true);

        fetch(config.serverUrl + "/api/meeting/" + id, { method: "GET", headers: { "Content-Type": "application/json" } }).then((res) => {

            switch (res.status) {
                case 404:
                    //room does not exist, create one
                    fetch(config.serverUrl + "/api/meeting/" + id, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    }).then((res) => {
                        if (res.status == 201) {
                            navigate("/meeting/join/" + id)
                        } else {
                            setInputsDisabled(false)
                        }
                    })
                    break;

                case 200:
                    //room exists, join
                    navigate("/meeting/join/" + id)
                    break;

                default:
                    setInputsDisabled(false)
                    break;
            }

        })
    }

    return <div className="page">
        <div className="mx-auto my-auto flex flex-col gap-8">
            <h1>Join/Create Meeting</h1>

            <div className="form-group">
                <label htmlFor="id">Meeting id</label>
                <input disabled={inputsDisabled} value={id} onChange={(ev) => { setId(ev.target.value) }} type="text" placeholder="ID" />
            </div>
            <button disabled={inputsDisabled} onClick={joinOrCreate}>Join/Create</button>
        </div>
    </div>
}

export default Index;
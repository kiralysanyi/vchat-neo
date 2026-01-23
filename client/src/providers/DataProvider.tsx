import { createContext, useState, type PropsWithChildren } from "react";

interface DataContextType {
    cameraStream: MediaStream | null;
    setCameraStream: React.Dispatch<React.SetStateAction<MediaStream | null>> | null;
    microphoneStream: MediaStream | null;
    setMicrophoneStream: React.Dispatch<React.SetStateAction<MediaStream | null>> | null;
    joined: boolean;
    setJoined: React.Dispatch<React.SetStateAction<boolean>> | null;
    setNickname: React.Dispatch<React.SetStateAction<string>> | null;
    nickname: string | null
}

const DataContext = createContext<DataContextType>({ cameraStream: null, microphoneStream: null, setCameraStream: null, setMicrophoneStream: null, joined: false, setJoined: null, setNickname: null, nickname: null })

const DataProvider = ({ children }: PropsWithChildren) => {
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
    const [joined, setJoined] = useState(false)
    const [nickname, setNickname] = useState("")

    return <DataContext.Provider value={{
        cameraStream, setCameraStream, microphoneStream, setMicrophoneStream, joined, setJoined, nickname, setNickname
    }}>
        {children}
    </DataContext.Provider>
}

export { DataContext, DataProvider }
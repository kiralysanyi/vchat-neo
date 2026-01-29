import { ComputerDesktopIcon } from "@heroicons/react/24/outline";
import StreamPlayer from "./StreamPlayer";
import type { Participant } from "../types/Participant";

const DefaultClientView = ({ cameraStream, nickname, participants, viewStream }: { cameraStream: MediaStream | null, nickname: string | null, participants: Record<string, Participant>, viewStream: (p: Participant) => void }) => {

    return <>
        {/* Streams / participants */}
        <div className="streams-container">
            <div className="participant">
                {cameraStream && <StreamPlayer stream={cameraStream} />}
                <span className="name">{nickname} (You)</span>
            </div>
            {Object.values(participants).map(p => (
                <div key={p.producerTransportId} className="participant">
                    {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                    {p.streaming && <span onClick={() => {
                        viewStream(p)
                    }} className="view">
                        <ComputerDesktopIcon width={28} height={28} />
                    </span>}
                    <span className="name">{p.nickname}</span>
                    <span className="options"></span>
                </div>
            ))}
        </div></>
}

export default DefaultClientView;
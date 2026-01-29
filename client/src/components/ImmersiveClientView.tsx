import { ComputerDesktopIcon } from "@heroicons/react/24/outline";
import StreamPlayer from "./StreamPlayer";
import type { Participant } from "../types/Participant";
import { useEffect, useState } from "react";

interface PropsType {
    cameraStream: MediaStream | null,
    nickname: string | null,
    participants: Record<string, Participant>,
    getStreamRef: React.RefObject<((transportId: string, payloadId: number, onClose: Function) => Promise<{
        stream: MediaStream;
        close: Function;
    }>) | undefined>,
    closeRef: React.RefObject<{
        closeVid: Function | undefined;
        closeAudio: Function | undefined;
    }>
}

const ImmersiveClientView = ({ cameraStream, nickname, participants, getStreamRef, closeRef }: PropsType) => {
    const [selectedP, setSelectedP] = useState<string>();
    const [viewedStream, setViewedStream] = useState<MediaStream>()

    const closeStream = () => {
        if (closeRef.current.closeVid) {
            closeRef.current.closeVid();
        }

        if (closeRef.current.closeAudio) {
            closeRef.current.closeAudio();
        }
    }

    useEffect(() => {
        if (Object.keys(participants).length > 0 && selectedP == undefined) {
            setSelectedP(Object.keys(participants)[0])
        }
    }, [participants])

    const viewParticipant = (id: string) => {
        closeStream();
        setSelectedP(id);
        setViewedStream(undefined)
    }

    const viewStream = (p: Participant) => {
        closeStream();
        if (p.streaming == true && getStreamRef.current != undefined) {
            // get screen video
            getStreamRef.current(p.producerTransportId, 3, () => {
                // onclose
                setViewedStream(undefined)
            }).then(({ stream, close }) => {
                closeRef.current.closeVid = close
                setViewedStream(stream)
                setSelectedP(p.producerTransportId);
            })

            // get screen audio

            if (p.streamingAudio == true) {
                getStreamRef.current(p.producerTransportId, 4, () => { }).then(({ stream, close }) => {
                    closeRef.current.closeAudio = close
                    //TODO: implement audio handling
                })
            }
        }
    }

    return <>
        {/* Streams / participants */}
        <div className="immersive-view">
            <div className="participant-view">
                {!viewedStream && (selectedP && participants[selectedP]) && ((participants[selectedP].cameraStream) && <StreamPlayer stream={participants[selectedP].cameraStream} />)}
                {viewedStream && <StreamPlayer stream={viewedStream} />}
            </div>
            <div className="participants-bar">
                <div className="participant-preview">
                    {cameraStream && <StreamPlayer stream={cameraStream} />}
                    <span className="name">{nickname} (You)</span>
                </div>
                {Object.values(participants).map(p => (
                    <div key={p.producerTransportId} className="participant-preview" onClick={() => { viewParticipant(p.producerTransportId) }}>
                        {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                        {p.streaming && <span onClick={(e) => {
                            e.stopPropagation();
                            viewStream(p)
                        }} className="view">
                            <ComputerDesktopIcon width={28} height={28} />
                        </span>}
                        <span className="name">{p.nickname}</span>
                        <span className="options"></span>
                    </div>
                ))}
            </div>
        </div></>
}

export default ImmersiveClientView;
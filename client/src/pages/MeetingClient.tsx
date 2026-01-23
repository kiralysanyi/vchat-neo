import { useContext, useEffect, useRef, useState } from "react";
import { DataContext } from "../providers/DataProvider";
import { useNavigate, useParams } from "react-router";
import getCamera from "../capture/getCamera";
import getMicrophone from "../capture/getMicrophone";
import socket from "../socket";
import { createRecvTransport, createSendTransport } from "../mediasoup/utils";
import { Device } from "mediasoup-client";
import getRouterCapabilities from "../mediasoup/getRouterCapabilities";
import type { Participant } from "../types/Participant";
import StreamPlayer from "../components/StreamPlayer";
import config from "../config";
import getScreen from "../capture/getScreen";
import type { Transport } from "mediasoup-client/types";
import { CameraIcon, ComputerDesktopIcon, MicrophoneIcon, PhoneArrowDownLeftIcon, XCircleIcon } from "@heroicons/react/24/outline";

const MeetingClient = () => {
    const {
        cameraStream,
        joined,
        microphoneStream,
        setMicrophoneStream,
        setCameraStream,
        nickname
    } = useContext(DataContext);

    const navigate = useNavigate();
    const params = useParams();

    const [participants, setParticipants] = useState<Record<string, Participant>>({});
    const [device, setDevice] = useState<Device | null>(null);
    const [sendStream, setSendStream] = useState<((stream: MediaStream, payloadId: number) => Promise<void>) | null>(null);
    const [connected, setConnected] = useState(socket.connected);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const getStreamRef = useRef<(transportId: string, payloadId: number, onClose: Function) => Promise<{ stream: MediaStream, close: Function }>>(undefined)

    const recTransportRef = useRef<Transport>(undefined);
    const sendTransportRef = useRef<Transport>(undefined);

    // 1. Navigation Guard
    useEffect(() => {
        if (connected) {
            fetch(config.serverUrl + "/api/meeting/" + params.id, { method: "GET", headers: { "Content-Type": "application/json" } }).then(async (res) => {
                if (res.status != 200) {
                    console.error("Meeting does not exist")
                    navigate("/")
                }
            })
        }

        if (!joined) {
            navigate("/meeting/join/" + params.id);
        }

    }, [joined, navigate, params.id, connected]);

    // 2. Setup Device
    useEffect(() => {
        let isMounted = true;
        const dev = new Device();

        getRouterCapabilities().then(async (capabilities) => {
            if (!isMounted) return;
            await dev.load({ routerRtpCapabilities: capabilities });
            setDevice(dev);
        }).catch(console.error);

        return () => { isMounted = false; };
    }, []);

    // 3. Handle Receiving Streams
    useEffect(() => {
        if (!device || !connected) return;

        let getStreamFunc: any;

        createRecvTransport(socket, device, (transport) => {
            recTransportRef.current = transport;
        }).then((getstream) => {
            getStreamFunc = getstream;
            getStreamRef.current = getstream;
            socket.emit("consumeReady");
        });

        const onNewProducer = async (transportId: string, payloadId: number) => {
            if (!getStreamFunc) return;

            const { stream } = await getStreamFunc(transportId, payloadId, () => {
                // On Close: Remove stream from participant
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[transportId]) return prev; // Guard against unknown participant

                    // Map payload IDs to specific stream properties
                    if (payloadId === 1) updated[transportId].cameraStream = undefined;
                    if (payloadId === 2) updated[transportId].microphoneStream = undefined;
                    if (payloadId === 3) updated[transportId].streaming = false;
                    if (payloadId === 3) updated[transportId].screenStream = undefined;
                    if (payloadId === 4) updated[transportId].screenAudioStream = undefined;

                    return { ...updated };
                });
            });
            console.log("Add consumer: ", transportId, payloadId)
            setParticipants(prev => {
                const updated = { ...prev };
                if (!updated[transportId]) return prev; // Guard against unknown participant

                // Map payload IDs to specific stream properties
                if (payloadId === 1) updated[transportId].cameraStream = stream;
                if (payloadId === 2) updated[transportId].microphoneStream = stream;
                // Only report that screenshare available
                if (payloadId === 3) updated[transportId].streaming = true;
                //if (payloadId === 4) updated[transportId].screenAudioStream = stream;

                return { ...updated };
            });
        };

        socket.on("newProducer", onNewProducer);

        return () => { socket.off("newProducer", onNewProducer); };
    }, [device, connected]);

    const [transportId, setTransportId] = useState<string>()

    // 4. Setup Send Transport
    useEffect(() => {
        if (!device || !connected) return;

        createSendTransport(socket, device, (transport) => {
            console.log("Send transport created");
            setTransportId(transport.id);
            sendTransportRef.current = transport;
        }).then((sendstream) => {

            setSendStream(() => sendstream);
        });
    }, [device, connected]);

    // 5. Produce Local Streams (Camera/Mic)

    useEffect(() => {
        if (cameraStream && sendStream && sendTransportRef.current) {
            sendStream(cameraStream, 1).then(() => {
                console.log("Sending camera stream")
                socket.emit("addstream", 1)
            })
        }
    }, [cameraStream, sendStream, sendTransportRef.current]);

    useEffect(() => {
        if (microphoneStream && sendStream && sendTransportRef.current) {
            sendStream(microphoneStream, 2).then(() => {
                console.log("Sending microphone stream")
                socket.emit("addstream", 2)
            })
        }
    }, [microphoneStream, sendStream, sendTransportRef.current]);

    // produce screen stream
    useEffect(() => {
        if (screenStream && sendStream) {
            const vid = screenStream.getVideoTracks()[0]
            const audio = screenStream.getAudioTracks()[0]
            console.log(vid, audio)
            sendStream(new MediaStream([vid]), 3).then(() => {
                console.log("Added screen video")
                socket.emit("addstream", 3)
                if (audio) {
                    sendStream(new MediaStream([audio]), 4).then(() => {
                        console.log("Added screen audio")

                        socket.emit("addstream", 4)
                    })
                }
            })


        }
    }, [screenStream, sendStream]);

    // 6. Participant Sync
    useEffect(() => {
        if (!transportId && !connected) {
            return;
        }

        const onLeft = (transportId: string) => {
            setParticipants(prev => {
                const { [transportId]: deletedItem, ...remaining } = prev;
                return remaining;
            });
        }

        socket.on("participantLeft", onLeft)
        socket.on("participants", (data: Record<string, Participant>) => setParticipants(data));
        socket.on("newJoined", (data: Participant) => {
            setParticipants(prev => ({ ...prev, [data.producerTransportId]: data }));
        });

        socket.emit("join", params.id, transportId, nickname);

        return () => {
            socket.off("participantLeft", onLeft);
            socket.off("participants");
            socket.off("newJoined");
            socket.emit("leave");
        };
    }, [params.id, transportId, connected]);

    // handle disconnect
    useEffect(() => {
        const onDisconnect = () => {
            setConnected(false);
            setParticipants({});
        }

        const onConnect = () => {
            setConnected(true);
        }

        socket.on("connect", onConnect)

        socket.on("disconnect", onDisconnect)

        return () => {
            socket.off("disconnect", onDisconnect)
        }
    }, [])

    // UI Handlers
    const toggleCamera = async () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            });

            setCameraStream?.(null);
        } else {
            try {
                const stream = await getCamera();
                setCameraStream?.(stream);
            } catch (e) { console.error(e); }
        }
    };

    const toggleMicrophone = async () => {
        if (microphoneStream) {
            microphoneStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            });
            setMicrophoneStream?.(null);
        } else {
            try {
                const stream = await getMicrophone();
                setMicrophoneStream?.(stream);
            } catch (e) { console.error(e); }
        }
    };


    const toggleScreen = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            })
            setScreenStream(null);
        } else {
            try {
                const stream = await getScreen();
                if (stream) {
                    stream.getVideoTracks()[0].addEventListener("ended", () => {
                        setScreenStream(null)
                    })
                }
                setScreenStream(stream)
            } catch (e) {
                console.error(e)
            }
        }
    }

    const [viewedParticipant, setViewedParticipant] = useState<Participant | null>(null);
    const [streamVolume, setStreamVolume] = useState(1);
    const closeRef = useRef<{ closeVid: Function | undefined, closeAudio: Function | undefined }>({ closeVid: undefined, closeAudio: undefined })

    const viewStream = (p: Participant) => {
        setStreamVolume(1)
        if (p.streaming == true && getStreamRef.current != undefined) {
            // get screen video
            getStreamRef.current(p.producerTransportId, 3, () => { }).then(({ stream, close }) => {
                closeRef.current.closeVid = close
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[p.producerTransportId]) return prev; // Guard against unknown participant

                    updated[p.producerTransportId].screenStream = stream

                    return { ...updated };
                });
                setViewedParticipant(p)
            })

            // get screen audio

            getStreamRef.current(p.producerTransportId, 4, () => { }).then(({ stream, close }) => {
                closeRef.current.closeAudio = close
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[p.producerTransportId]) return prev; // Guard against unknown participant

                    updated[p.producerTransportId].screenAudioStream = stream

                    return { ...updated };
                });
                setViewedParticipant(p)
            })
        }
    }

    // close all transports on leave
    useEffect(() => {
        return () => {
            screenStream?.getTracks().forEach((track) => {
                track.onended && track.onended(new Event("ended"))
                track.stop()
            })

            cameraStream?.getTracks().forEach((track) => {
                track.onended && track.onended(new Event("ended"))
                track.stop()
            })

            microphoneStream?.getTracks().forEach((track) => {
                track.onended && track.onended(new Event("ended"))
                track.stop()
            })


            sendTransportRef.current && sendTransportRef.current.close();
            recTransportRef.current && recTransportRef.current.close();
        }
    }, [])


    return (
        <div className="page flex flex-col">
            <div className="streams-container">
                <div className="participant border p-2">
                    {cameraStream && <StreamPlayer stream={cameraStream} />}
                    <span className="name">{nickname} (You)</span>
                </div>
                {Object.values(participants).map(p => (
                    <div key={p.producerTransportId} className="participant border p-2">
                        {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                        {p.microphoneStream && <StreamPlayer stream={p.microphoneStream} />}
                        {p.streaming && <span onClick={() => {
                            viewStream(p)
                        }} className="view">
                            <ComputerDesktopIcon width={32} height={32} />
                        </span>}
                        <span className="name">{p.nickname}</span>
                    </div>
                ))}
            </div>
            {viewedParticipant && <div className="screenviewer">
                <button className="fixed top-0 right-0 z-10 opacity-25" onClick={() => {
                    setViewedParticipant(null)
                    if (closeRef.current.closeVid) {
                        closeRef.current.closeVid()
                    }
                    if (closeRef.current.closeAudio) {
                        closeRef.current.closeAudio()
                    }
                }}>
                    <XCircleIcon width={32} height={32} />
                </button>
                {viewedParticipant.screenStream && <StreamPlayer stream={viewedParticipant.screenStream} />}
                {viewedParticipant.screenAudioStream && <StreamPlayer volume={streamVolume} stream={viewedParticipant.screenAudioStream} />}
            </div>}
            <div className="dock">
                <button className={cameraStream ? "btn-red" : ""} onClick={toggleCamera}>
                    <CameraIcon width={32} height={32} />
                </button>
                <button className={microphoneStream ? "btn-red" : ""} onClick={toggleMicrophone}>
                    <MicrophoneIcon width={32} height={32} />
                </button>
                <button className={screenStream ? "btn-red" : ""} onClick={toggleScreen}>
                    <ComputerDesktopIcon width={32} height={32} />
                </button>
                <button className="btn-red" onClick={() => {
                    navigate("/")
                }}>
                    <PhoneArrowDownLeftIcon width={32} height={32} />
                </button>
            </div>
        </div>
    );
};

export default MeetingClient;
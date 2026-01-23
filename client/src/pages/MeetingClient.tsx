import { useContext, useEffect, useState } from "react";
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
    const [connected, setConnected] = useState(socket.connected)
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
        if (!device) return;

        let getStreamFunc: any;

        createRecvTransport(socket, device).then((getstream) => {
            getStreamFunc = getstream;
            socket.emit("consumeReady");
        });

        const onNewProducer = async (transportId: string, payloadId: number) => {
            if (!getStreamFunc) return;

            const stream = await getStreamFunc(transportId, payloadId, () => {
                // On Close: Remove stream from participant
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[transportId]) return prev; // Guard against unknown participant

                    // Map payload IDs to specific stream properties
                    if (payloadId === 1) updated[transportId].cameraStream = undefined;
                    if (payloadId === 2) updated[transportId].microphoneStream = undefined;
                    if (payloadId === 3) updated[transportId].screenStream = undefined;
                    if (payloadId === 4) updated[transportId].screenAudioStream = undefined;

                    return { ...updated };
                });
            });

            setParticipants(prev => {
                const updated = { ...prev };
                if (!updated[transportId]) return prev; // Guard against unknown participant

                // Map payload IDs to specific stream properties
                if (payloadId === 1) updated[transportId].cameraStream = stream;
                if (payloadId === 2) updated[transportId].microphoneStream = stream;
                if (payloadId === 3) updated[transportId].screenStream = stream;
                if (payloadId === 4) updated[transportId].screenAudioStream = stream;

                return { ...updated };
            });
        };

        socket.on("newProducer", onNewProducer);

        // start consume streams at join
        socket.once("participants", (data: Record<string, Participant>) => {
            for (let i in data) {
                onNewProducer(data[i].producerTransportId, 1).catch(() => console.log("No stream on ch 1"))
                onNewProducer(data[i].producerTransportId, 2).catch(() => console.log("No stream on ch 2"))
                onNewProducer(data[i].producerTransportId, 3).catch(() => console.log("No stream on ch 3"))
                onNewProducer(data[i].producerTransportId, 4).catch(() => console.log("No stream on ch 4"))

            }
        })

        return () => { socket.off("newProducer", onNewProducer); };
    }, [device]);

    const [transportId, setTransportId] = useState<string>()

    // 4. Setup Send Transport
    useEffect(() => {
        if (!device) return;

        createSendTransport(socket, device, (transport) => {
            console.log("Send transport created");
            setTransportId(transport.id)
        }).then((sendstream) => {

            setSendStream(() => sendstream);
        });
    }, [device]);

    // 5. Produce Local Streams (Camera/Mic)
    useEffect(() => {
        if (cameraStream && sendStream) {
            sendStream(cameraStream, 1).then(() => {
                socket.emit("addstream", 1)
            })
        }
    }, [cameraStream, sendStream]);

    useEffect(() => {
        if (microphoneStream && sendStream) {
            sendStream(microphoneStream, 2).then(() => {
                socket.emit("addstream", 2)
            })
        }
    }, [microphoneStream, sendStream]);

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

    return (
        <div className="page flex flex-col">
            <div className="flex flex-row w-full h-full flex-wrap">
                <div className="participant border p-2">
                    {cameraStream && <StreamPlayer stream={cameraStream} />}
                    <span className="block font-bold">{nickname} (You)</span>
                </div>
                {Object.values(participants).map(p => (
                    <div key={p.producerTransportId} className="participant border p-2">
                        {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                        {p.microphoneStream && <StreamPlayer stream={p.microphoneStream} />}
                        <span className="block">{p.nickname}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-row gap-4 p-4 bg-gray-100">
                <button onClick={toggleCamera}>
                    {cameraStream ? "Disable Camera" : "Enable Camera"}
                </button>
                <button onClick={toggleMicrophone}>
                    {microphoneStream ? "Disable Microphone" : "Enable Microphone"}
                </button>
                <button onClick={() => {
                    navigate("/")
                }}>Leave</button>
            </div>
        </div>
    );
};

export default MeetingClient;
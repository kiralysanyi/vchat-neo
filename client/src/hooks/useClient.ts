import { Device } from "mediasoup-client";
import type { ConnectionState, Transport } from "mediasoup-client/types";
import config from "../config";
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { checkCamera } from "../capture/getCamera";
import { checkMicrophone } from "../capture/getMicrophone";
import getRouterCapabilities from "../mediasoup/getRouterCapabilities";
import { createRecvTransport, createSendTransport } from "../mediasoup/utils";
import { DataContext } from "../providers/DataProvider";
import socket from "../socket";
import type { Participant } from "../types/Participant";

const useClient = () => {
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

    const [hasAudio, setHasAudio] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);

    const [viewedParticipant, setViewedParticipant] = useState<Participant | null>(null);
    const closeRef = useRef<{ closeVid: Function | undefined, closeAudio: Function | undefined }>({ closeVid: undefined, closeAudio: undefined });
    const [transportId, setTransportId] = useState<string>()



    // check device
    useEffect(() => {
        checkCamera().then((has) => {
            setHasVideo(has)
        })

        checkMicrophone().then((has) => {
            setHasAudio(has)
        })
    }, [])

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
        if (!connected) return;

        let isMounted = true;
        const dev = new Device();

        getRouterCapabilities().then(async (capabilities) => {
            if (!isMounted) return;
            await dev.load({ routerRtpCapabilities: capabilities });
            setDevice(dev);
        }).catch(console.error);

        return () => { isMounted = false; };
    }, [connected]);

    // 3. Handle Receiving Streams
    useEffect(() => {
        if (!device) return;

        let getStreamFunc: any;

        createRecvTransport(socket, device, (transport) => {
            recTransportRef.current = transport;
        }).then((getstream) => {
            getStreamFunc = getstream;
            getStreamRef.current = getstream;
            socket.emit("consumeReady");
        });

        const onNewProducer = async (transportId: string, payloadId: number) => {
            if (!getStreamFunc || !connected) return;

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
                    if (payloadId === 4) updated[transportId].streamingAudio = undefined;

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
                if (payloadId === 4) updated[transportId].streamingAudio = true;

                return { ...updated };
            });
        };

        console.log("Attach newProducer listener")
        socket.on("newProducer", onNewProducer);

        return () => {
            console.log("Detach newProducer")
            socket.off("newProducer", onNewProducer);
        };
    }, [device]);


    // 4. Setup Send Transport
    useEffect(() => {
        if (!device) return;

        createSendTransport(socket, device, (transport) => {
            console.log("Send transport created");
            setTransportId(transport.id);
            sendTransportRef.current = transport;
        }).then((sendstream) => {

            setSendStream(() => sendstream);
        });
    }, [device]);

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

    // close all transports on leave
    useEffect(() => {
        return () => {
            console.log("Closing streams")
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

    // log transport states
    useEffect(() => {
        const onStateChange = (state: ConnectionState) => {
            console.log("Transport state: ", state)
        }

        sendTransportRef.current?.on("connectionstatechange", onStateChange);
        recTransportRef.current?.on("connectionstatechange", onStateChange);

        return () => {
            sendTransportRef.current?.off("connectionstatechange", onStateChange);
            recTransportRef.current?.off("connectionstatechange", onStateChange);
        }


    }, [sendTransportRef, recTransportRef])

    return {
        cameraStream,
        joined,
        microphoneStream,
        setMicrophoneStream,
        setCameraStream,
        nickname,
        participants, setParticipants,
        connected,
        screenStream, setScreenStream,
        hasAudio, hasVideo,
        viewedParticipant, setViewedParticipant,
        closeRef,
        getStreamRef
    }
}

export default useClient;
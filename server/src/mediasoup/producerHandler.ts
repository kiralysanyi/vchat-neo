import { DtlsParameters, MediaKind, Producer, Router, RtpParameters, Transport } from "mediasoup/node/lib/types";
import createTransport from "./createTransport";
import { LISTEN_IPS } from "../config";
import { ExtendedProducer } from "../types/ExtendedProducer";
import { ExtendedSocket } from "../types/ExtendedSocket";
import { CustomAppData } from "../types/CustomAppdata";

const producerHandler = (
    router: Router,
    socket: ExtendedSocket,
    producers: Record<string, ExtendedProducer>,
    onCreate?: (transportId: string) => void,
    onProduce?: (transportId: string, payloadId: number) => void,
    onProducerClose?: (transportId: string, payloadId: number) => void
): void => {
    console.log("Attach producer handler to ", socket.id)

    let transport: Transport | null = null;

    // 1. Create Transport logic
    const onCreateProducerTransport = async (_: any, cb: any) => {
        try {
            console.log("================================")
            console.log("Creating new producer transport for ", socket.id)
            if (router.closed) {
                console.error("Router closed for some reason")
                cb({ error: "Router closed" })
            }
            const { transport: newTransport, params } = await createTransport(router, LISTEN_IPS);
            transport = newTransport;

            console.log("Transport created: ", transport.id)

            transport.on("@close", () => {
                console.log("Transport closed: ", transport?.id)
                if (transport) {
                    delete producers[transport.id]
                }
            })

            transport.on("listenererror", (err) => {
                console.error("Transport error: ", err)
            })

            producers[transport.id] = {
                transportId: transport.id,
                producers: {}
            };

            if (onCreate) onCreate(transport.id);
            cb(params);
        } catch (error) {
            console.error("Failed to create producer transport:", error);
            cb({ error: "Internal Server Error" });
        }
    };

    // 2. Connection handshake logic
    const onConnectProducerTransport = async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, cb: any) => {
        if (!transport) {
            console.error("Transport not initialized")
            return cb({ error: "Transport not initialized" });
        }

        try {
            await transport.connect({ dtlsParameters });
            console.log("Transport connected")
            cb();
        } catch (error) {
            console.error("Connection failed: ", error)
            cb({ error: "Connection failed" });
        }
    };

    // 3. Media production logic
    const onProduceEvent = async ({ kind, rtpParameters, appData }: { kind: MediaKind, rtpParameters: RtpParameters, payloadId: number, appData: CustomAppData }, cb: any) => {
        if (!transport) return cb({ error: "Transport not ready" });

        try {
            const producer = await transport.produce({ rtpParameters, kind, appData });
            const payloadId = appData.payloadId;

            // if payload is screenshare then listen for broadcast ending and send out signal
            if (payloadId === 3 || payloadId === 4) {
                producer.on("@close", () => {
                    if (socket.meetid) {
                        console.log(socket.meetid, transport?.id, payloadId)
                        socket.to(socket.meetid).emit("removeProducer", transport?.id, payloadId);
                    } else {
                        console.log("Socket meetid was not set, broadcasting screenshare end signal aborted")
                    }

                })
            }


            // Store the producer in our record
            producers[transport.id].producers[payloadId] = producer;

            // Clean up record if producer closes
            producer.on("transportclose", () => {
                producer.close();
                console.log("Transport closed")
                delete producers[transport!.id].producers[payloadId];
            });

            onProduce && onProduce(transport.id, payloadId)

            cb({ id: producer.id });
        } catch (error: any) {
            console.error("Produce error: ", error)
            cb({ error: error.message });
        }
    };

    const onPclose = (transportId: string, payloadId: number) => {
        if (producers[transportId] == undefined) {
            return;
        }

        if (socket.meetid) {
            console.log(socket.meetid, transportId, payloadId)
            socket.to(socket.meetid).emit("removeProducer", transportId, payloadId);
        } else {
            console.log("Socket meetid was not set, broadcasting screenshare end signal aborted")
        }

        if (producers[transportId].producers[payloadId]) {
            producers[transportId].producers[payloadId].close()
            onProducerClose && onProducerClose(transportId, payloadId)
            delete producers[transportId].producers[payloadId];
            console.log("Closed producer: ", transportId, payloadId)
        }
    }

    socket.on("pclose", onPclose);

    // Attach listeners once at the top level
    socket.on("createProducerTransport", onCreateProducerTransport);
    socket.on("connectProducerTransport", onConnectProducerTransport);
    socket.on("produce", onProduceEvent);

    // Cleanup function
    socket.detachProducer = () => {
        socket.off("createProducerTransport", onCreateProducerTransport);
        socket.off("connectProducerTransport", onConnectProducerTransport);
        socket.off("produce", onProduceEvent);
        socket.off("pclose", onPclose);

        if (transport) {
            transport.close();
            delete producers[transport.id];
        }
    };
};

export default producerHandler;
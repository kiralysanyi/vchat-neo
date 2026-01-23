import { DtlsParameters, MediaKind, Producer, Router, RtpParameters, Transport } from "mediasoup/node/lib/types";
import createTransport from "./createTransport";
import { LISTEN_IPS } from "../config";
import { ExtendedProducer } from "../types/ExtendedProducer";
import { ExtendedSocket } from "../types/ExtendedSocket";

const producerHandler = (
    router: Router,
    socket: ExtendedSocket,
    producers: Record<string, ExtendedProducer>,
    onCreate?: (transportId: string) => void,
    onProduce?: (transportId: string, payloadId: number) => void,
    onProducerClose?: (transportId: string, payloadId: number) => void
): void => {

    let transport: Transport | null = null;

    // 1. Create Transport logic
    const onCreateProducerTransport = async (_: any, cb: any) => {
        try {
            const { transport: newTransport, params } = await createTransport(router, LISTEN_IPS);
            transport = newTransport;

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
        if (!transport) return cb({ error: "Transport not initialized" });

        try {
            await transport.connect({ dtlsParameters });
            cb();
        } catch (error) {
            cb({ error: "Connection failed" });
        }
    };

    // 3. Media production logic
    const onProduceEvent = async ({ kind, rtpParameters, payloadId }: { kind: MediaKind, rtpParameters: RtpParameters, payloadId: number }, cb: any) => {
        if (!transport) return cb({ error: "Transport not ready" });

        try {
            const producer = await transport.produce({ rtpParameters, kind });

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
import { Transport, Router, DtlsParameters, RtpCapabilities, MediaKind, Consumer } from "mediasoup/node/lib/types"
import createTransport from "./createTransport"
import { LISTEN_IPS } from "../config"
import { ExtendedProducer } from "../types/ExtendedProducer"
import { ExtendedSocket } from "../types/ExtendedSocket"

const consumerHandler = (
    router: Router, 
    socket: ExtendedSocket, 
    producers: Record<string, ExtendedProducer>, 
    onConsumeRequest: (producerId: string, accept: Function, deny: Function) => void
): void => {
    
    let transport: Transport | null = null;

    const onCreateConsumerTransport = async (_: any, cb: any) => {
        const { transport: newTransport, params } = await createTransport(router, LISTEN_IPS);
        transport = newTransport;

        // Cleanup if transport is closed
        transport.on("routerclose", () => transport?.close());

        cb(params);
    };

    const onConnectConsumerTransport = async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, cb: any) => {
        if (!transport) return cb({ error: "Transport not found" });
        
        await transport.connect({ dtlsParameters });
        cb(); // Acknowledge connection
    };

    const onConsume = async ({ rtpCapabilities, transportId, payloadId }: any, cb: any) => {
        if (!transport) return cb({ error: "Transport not created" });

        onConsumeRequest(transportId, async () => {
            try {
                const producer = producers[transportId]?.producers[payloadId];
                const producerId = producer.id;

                if (!router.canConsume({ producerId, rtpCapabilities })) {
                    return cb({ error: "Cannot consume" });
                }

                const consumer = await transport!.consume({
                    producerId,
                    rtpCapabilities,
                    paused: true, // Start paused to prevent packet loss before client is ready
                });

                // Resume the consumer so media starts flowing
                await consumer.resume();

                // attach producer close listener
                producer.on("@close", () => {
                    consumer.close();
                    socket.emit("conclose", consumer.id)
                })

                producer.on("transportclose", () => {
                    consumer.close();
                    socket.emit("conclose", consumer.id)
                })

                cb({
                    id: consumer.id,
                    producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters
                });
            } catch (err: any) {
                cb({ error: err.message });
            }
        }, () => {
            cb({ error: "Consume denied" });
        });
    };

    // Attach listeners
    socket.on("createConsumerTransport", onCreateConsumerTransport);
    socket.on("connectConsumerTransport", onConnectConsumerTransport);
    socket.on("consume", onConsume);

    socket.detachConsumer = () => {
        socket.off("createConsumerTransport", onCreateConsumerTransport);
        socket.off("connectConsumerTransport", onConnectConsumerTransport);
        socket.off("consume", onConsume);
        transport?.close();
    };
};

export default consumerHandler
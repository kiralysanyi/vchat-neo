import { DtlsParameters, MediaKind, Producer, Router, RtpParameters, Transport } from "mediasoup/node/lib/types";
import { Socket } from "socket.io";
import createTransport from "./createTransport";
import { LISTEN_IPS } from "../config";
import { ExtendedProducer } from "../types/ExtendedProducer";
import { ExtendedSocket } from "../types/ExtendedSocket";

const producerHandler = (router: Router, socket: ExtendedSocket, producers: Record<string, ExtendedProducer>, onCreate?: (transportId: string) => void): Promise<Function> => {

    return new Promise((resolved) => {
        const onCreateProducerTransport = async (_: any, cb: any) => {
            const { transport, params } = await createTransport(router, LISTEN_IPS);
            producers[transport.id] = {
                transportId: transport.id,
                producers: {}
            }
            cb(params)

            if (onCreate) {
                onCreate(transport.id)
            }

            const onConnectProducerTransport = async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, cb: any) => {
                await transport.connect({ dtlsParameters })
                cb()

                const onProduceEvent = async ({ kind, rtpParameters, payloadId }: { kind: MediaKind, rtpParameters: RtpParameters, payloadId: number }, cb: any) => {
                    const producer = await transport.produce({ rtpParameters, kind });
                    cb({
                        id: producer.id
                    });
                    producers[transport.id].producers[payloadId] = producer
                }

                socket.on("produce", onProduceEvent);
                socket.detachProducer = () => {
                    socket.off("produce", onProduceEvent);
                    socket.off("connectProducerTransport", onConnectProducerTransport);
                    socket.off("createProducerTransport", onCreateProducerTransport);
                    transport.close();
                }
            }

            socket.on("connectProducerTransport", onConnectProducerTransport)
        }

        socket.on("createProducerTransport", onCreateProducerTransport)
    })
}

export default producerHandler;
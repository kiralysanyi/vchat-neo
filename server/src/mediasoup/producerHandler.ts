import { DtlsParameters, MediaKind, Producer, Router, RtpParameters, Transport } from "mediasoup/node/lib/types";
import { Socket } from "socket.io";
import createTransport from "./createTransport";
import { LISTEN_IPS } from "../config";

const producerHandler = (router: Router, socket: Socket, onProduce: (producer: Producer, kind: MediaKind, payloadId: number) => void, onNewTransport?: (transport: Transport) => void): Promise<Function> => {

    return new Promise((resolved) => {
        const onCreateProducerTransport = async (_: any, cb: any) => {
            const { transport, params } = await createTransport(router, LISTEN_IPS);
            onNewTransport? onNewTransport(transport): null;
            cb(params)

            const onConnectProducerTransport = async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, cb: any) => {
                await transport.connect({ dtlsParameters })
                cb()

                const onProduceEvent = async ({ kind, rtpParameters, payloadId }: { kind: MediaKind, rtpParameters: RtpParameters, payloadId: number }, cb: any) => {
                    const producer = await transport.produce({ rtpParameters, kind });
                    cb();
                    onProduce(producer, kind, payloadId)
                }

                socket.on("produce", onProduceEvent);
                resolved(() => {
                    socket.off("produce", onProduceEvent);
                    socket.off("connectProducerTransport", onConnectProducerTransport);
                    socket.off("createProducerTransport", onCreateProducerTransport);
                })
            }

            socket.on("connectProducerTransport", onConnectProducerTransport)
        }

        socket.on("createProducerTransport", onCreateProducerTransport)
    })
}

export default producerHandler;
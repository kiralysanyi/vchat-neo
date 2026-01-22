import { Transport, Router, DtlsParameters, RtpCapabilities, MediaKind, Consumer } from "mediasoup/node/lib/types"
import { Socket } from "socket.io"
import createTransport from "./createTransport"
import { LISTEN_IPS } from "../config"
import { ExtendedProducer } from "../types/ExtendedProducer"

const consumerHandler = (router: Router, socket: Socket, producers: Record<string, ExtendedProducer>, onConsumeRequest: (producerId: string, accept: Function, deny: Function) => void): Promise<Function> => {
    return new Promise((resolved) => {
        const onCreateConsumerTansport = async (_: any, cb: any) => {
            const { transport, params } = await createTransport(router, LISTEN_IPS);

            const onConnectConsumerTransport = async ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, cb: any) => {
                await transport.connect({ dtlsParameters })

                const onConsume = ({ rtpCapabilities, transportId, payloadId }: { rtpCapabilities: RtpCapabilities, transportId: string, payloadId: number }, cb: any) => {
                    onConsumeRequest(transportId, async () => {
                        //accept
                        const producerId = producers[transportId].producers[payloadId].id;
                        if (!router.canConsume({ producerId: producerId, rtpCapabilities })) {
                            cb({ error: "Router reported that consume is not possible" })
                            console.error("Router reported that consume is not possible")
                            return;
                        }

                        const consumer = await transport.consume({
                            producerId,
                            rtpCapabilities
                        })

                        cb({
                            id: consumer.id,
                            producerId: producerId,
                            kind: consumer.kind,
                            rtpParameters: consumer.rtpParameters
                        });

                        

                    }, () => {
                        //deny
                        cb({ error: "Consume denied" })
                    })
                }

                socket.on("consume", onConsume)
                cb();

                resolved(() => {
                    socket.off("consume", onConsume);
                    socket.off("connectConsumerTransport", onConnectConsumerTransport);
                    socket.off("createConsumerTransport", onCreateConsumerTansport);
                    transport.close();
                })

            }

            socket.on("connectConsumerTransport", onConnectConsumerTransport)

            cb(params)
        }

        socket.on("createConsumerTransport", onCreateConsumerTansport)
    })
}

export default consumerHandler
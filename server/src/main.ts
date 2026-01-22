
import express from "express";
import http from "http"
import { Server } from "socket.io";
import { createWorker } from "mediasoup";
import createRouter from "./mediasoup/createRouter";
import { PORT } from "./config";
import producerHandler from "./mediasoup/producerHandler";
import { ExtendedProducer } from "./types/ExtendedProducer";
import { Producer } from "mediasoup/node/lib/types";
import consumerHandler from "./mediasoup/consumerHandler";
import { ExtendedSocket } from "./types/ExtendedSocket";

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const producerTransports: Record<string, ExtendedProducer> = {};

createWorker().then(async (worker) => {
    const router = await createRouter(worker)

    io.on("connection", async (socket: ExtendedSocket) => {
        const detachProducerHandler = await producerHandler(router, socket, producerTransports, (transportId) => {
            socket.on("disconnect", () => {
                delete producerTransports[transportId];
            })
        });

        const detachConsumerHandler = await consumerHandler(router, socket, producerTransports, (transportId, accept, deny) => {
            console.log(transportId)
            accept();
        })

        socket.on("disconnect", () => { detachProducerHandler(), detachConsumerHandler() })
    })

    app.get('/', (req, res) => {
        res.send('<h1>Hello world</h1>');
    });

    server.listen(PORT, () => {
        console.log('listening on *:' + PORT);
    });
})



import express from "express";
import http from "http"
import { Server } from "socket.io";
import { createWorker } from "mediasoup";
import createRouter from "./mediasoup/createRouter";
import { PORT } from "./config";
import producerHandler from "./mediasoup/producerHandler";
import { ExtendedProducer } from "./types/ExtendedProducer";
import consumerHandler from "./mediasoup/consumerHandler";
import { ExtendedSocket } from "./types/ExtendedSocket";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {cors: {origin: "*"}});

const producerTransports: Record<string, ExtendedProducer> = {};

app.use(cors({origin: "*"}))

createWorker().then(async (worker) => {
    const router = await createRouter(worker)

    io.on("connection", async (socket: ExtendedSocket) => {

        producerHandler(router, socket, producerTransports, (transportId) => {
            socket.on("disconnect", () => {
                delete producerTransports[transportId];
            })
        });

        consumerHandler(router, socket, producerTransports, (transportId, accept, deny) => {
            console.log(transportId)
            accept();
        })

        socket.on("disconnect", () => {
            if (socket.detachConsumer) {
                socket.detachConsumer();
            }

            if (socket.detachProducer) {
                socket.detachProducer();
            }
        })

        console.log("Connected socket")
    })

    app.get('/', (req, res) => {
        res.send('<h1>Hello world</h1>');
    });

    app.get("/api/router/capabilities", (req, res) => {
        res.json({
            rtpCapabilities: router.rtpCapabilities
        })
    })

    server.listen(PORT, () => {
        console.log('listening on *:' + PORT);
    });
})


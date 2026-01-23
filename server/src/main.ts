
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
import { Meeting } from "./types/Meeting";

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

const producerTransports: Record<string, ExtendedProducer> = {};

const meetings: Record<string, Meeting> = {};

app.use(cors({ origin: "*" }))

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

        //meeting related stuff

        socket.on("join", (meetingId: string, transportId: string, nickname) => {
            if (meetings[meetingId] == undefined) {
                console.error("Meeting not found: ", meetingId)
                return;
            }

            const meeting = meetings[meetingId]

            socket.emit("participants", meeting.participants)

            meeting.participants[transportId] = {
                nickname: nickname,
                producerTransportId: transportId
            }

            socket.join(meeting.id);

            socket.to(meeting.id).emit("newJoined", {
                nickname: nickname,
                producerTransportId: transportId
            })

            const onAddStream = (payloadId: string) => {
                socket.to(meeting.id).emit("newProducer", transportId, payloadId)
            }

            socket.on("addstream", onAddStream)

            socket.once("disconnect", () => {
                socket.off("addstream", onAddStream)
                socket.to(meeting.id).emit("participantLeft", transportId)
                delete meeting.participants[transportId];
            })
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

    app.get("/api/router/capabilities", (req, res) => {
        res.json({
            rtpCapabilities: router.rtpCapabilities
        })
    })

    // create meeting
    app.post("/api/meeting/:id", (req, res) => {
        const id = req.params.id;

        if (meetings[id]) {
            return res.status(409).json({
                error: "Meeting exists"
            })
        }

        meetings[id] = {
            id: id,
            participants: {}
        }

        return res.status(201).json({
            message: "Created"
        })
    })

    //get meeting info

    app.get("/api/meeting/:id", (req, res) => {
        const meeting = meetings[req.params.id];

        if (meeting == undefined) {
            return res.status(404).json({
                error: "Not found"
            })
        }

        return res.json(meeting)
    })

    // handle non existent pages

    app.use((req, res) => {
        res.status(404).json({
            error: "Not found"
        })
    })

    server.listen(PORT, () => {
        console.log('listening on *:' + PORT);
    });
})


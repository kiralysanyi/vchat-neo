
import express from "express";
import http from "http"
import { config } from "dotenv";
import { Server } from "socket.io";
import { createWorker } from "mediasoup";
import createRouter from "./mediasoup/createRouter";

config();
const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);

const io = new Server(server);

createWorker().then(async (worker) => {
    const router = await createRouter(worker)

    app.get('/', (req, res) => {
        res.send('<h1>Hello world</h1>');
    });

    server.listen(PORT, () => {
        console.log('listening on *:' + PORT);
    });
})


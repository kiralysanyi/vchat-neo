
import express from "express";
import http from "http"
import { config } from "dotenv";

config();
const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});
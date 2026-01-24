import { AppData } from "mediasoup/node/lib/types";

interface CustomAppData extends AppData {
    payloadId: number
}

export type {CustomAppData};
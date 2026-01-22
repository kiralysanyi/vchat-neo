import { RouterRtpCodecCapability, Worker } from "mediasoup/node/lib/types";

const createRouter = async (worker: Worker) => {
    let mediaCodecs: RouterRtpCodecCapability[] = [
        {
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
            parameters: {
                'x-google-start-bitrate': 1000
            }
        },
        {
            kind: 'video',
            mimeType: "video/VP9",
            clockRate: 90000,
            parameters: {
                'x-google-start-bitrate': 1000,
            }
        },
        {
            kind: 'video',
            mimeType: 'video/AV1',
            clockRate: 90000,
            parameters: {},
            rtcpFeedback: [
                { type: 'nack' },
                { type: 'nack', parameter: 'pli' },
                { type: 'ccm', parameter: 'fir' },
                { type: 'goog-remb' },
                { type: 'transport-cc' },
            ],
        },
        {
            kind: 'video',
            mimeType: 'video/H264',
            clockRate: 90000,
            parameters: {
                'packetization-mode': 1,
                'profile-level-id': '42e01f',
                'level-asymmetry-allowed': 1
            },
            rtcpFeedback: [
                { type: 'nack' },
                { type: 'nack', parameter: 'pli' },
                { type: 'ccm', parameter: 'fir' },
                { type: 'goog-remb' },
                { type: 'transport-cc' }
            ]
        },
        {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
            parameters: {
                // Tells the browser to send stereo
                'sprop-stereo': 1,
                'stereo': 1,
                // Increase bitrate for high-quality music/video audio
                // 128000 (128kbps) is usually the sweet spot for screenshare
                'maxaveragebitrate': 128000,
                // Disable DTX to prevent the audio from "cutting out" during quiet parts
                'usedtx': 0,
                'useinbandfec': 1
            }
        }
    ];

    const router = await worker.createRouter({ mediaCodecs });

    return worker;
}

export default createRouter;
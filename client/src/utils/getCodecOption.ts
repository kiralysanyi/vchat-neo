import type { ProducerCodecOptions, RtpCodecCapability } from "mediasoup-client/types"

const getCodecOption = (codecName: string): { codec: RtpCodecCapability, codecOptions: ProducerCodecOptions } => {
    let codec: RtpCodecCapability;
    let codecOptions: ProducerCodecOptions = {
        videoGoogleMaxBitrate: 3000000,
        videoGoogleMinBitrate: 500000,
        videoGoogleStartBitrate: 1000000
    }

    switch (codecName) {
        case "VP9":
            codec = {
                preferredPayloadType: 96,
                kind: 'video',
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 15000,
                },
            }

            break;

        case "VP8":

            codec = {
                preferredPayloadType: 96,
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 15000,
                }
            }

            break;

        case "AV1":
            codec = {
                preferredPayloadType: 96,
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
            }

            break;

        case "H264":
            codec = {
                preferredPayloadType: 96,
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
            }

            break;

        default:
            console.log("Defaulted back to VP9");
            codec = {
                preferredPayloadType: 96,
                kind: 'video',
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 15000,
                },
            }
            break;
    }

    return { codec, codecOptions }
}

export default getCodecOption
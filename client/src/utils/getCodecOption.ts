import type { ProducerCodecOptions, RtpCodecCapability } from "mediasoup-client/types"

const getCodecOption = (codecName: string, highQuality = false): { codec: RtpCodecCapability, codecOptions: ProducerCodecOptions } => {
    let codec: RtpCodecCapability;
    let codecOptions: ProducerCodecOptions = {
        videoGoogleMaxBitrate: highQuality ? 8_000_000 : 1_500_000,
        videoGoogleMinBitrate: highQuality ? 1_000_000 : 300_000,
        videoGoogleStartBitrate: highQuality ? 2_000_000 : 800_000
    }

    switch (codecName) {
        case "VP9":
            codec = {
                preferredPayloadType: 99,
                kind: 'video',
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'profile-id': 0,
                    'scalabilityMode': 'L1T3'
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

        case "VP8":
            codec = {
                preferredPayloadType: 98,
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'scalabilityMode': 'L1T3'
                }
            }

            break;

        case "AV1":
            codec = {
                preferredPayloadType: 100,
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
                kind: 'video',
                mimeType: 'video/H264',
                clockRate: 90000,
                preferredPayloadType: 102,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1,
                },
                rtcpFeedback: [
                    { type: 'nack' },
                    { type: 'nack', parameter: 'pli' },
                    { type: 'ccm', parameter: 'fir' },
                    { type: 'goog-remb' },
                    { type: 'transport-cc' }
                ]
            };
            break;
        default:
            console.log("Defaulted back to VP8");
            codec = {
                preferredPayloadType: 98,
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'scalabilityMode': 'L1T3'
                }
            }
            break;
    }

    return { codec, codecOptions }
}

export default getCodecOption
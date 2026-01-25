import type { ProducerCodecOptions, RtpCodecCapability } from "mediasoup-client/types"

const getCodecOption = (codecName: string, highQuality = false): { codec: RtpCodecCapability, codecOptions: ProducerCodecOptions } => {
    let codec: RtpCodecCapability;
    let codecOptions: ProducerCodecOptions = {
        videoGoogleMaxBitrate: highQuality ? 5000000 : 3000000,
        videoGoogleMinBitrate: highQuality ? 500000 : 200000,
        videoGoogleStartBitrate: highQuality ? 1000000 : 200000
    }

    switch (codecName) {
        case "VP9":
            codec = {
                preferredPayloadType: 96,
                kind: 'video',
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'profile-id': 0,
                    'scalabilityMode': 'L3T3'
                }
            }

            break;

        case "VP8":
            codec = {
                preferredPayloadType: 96,
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
                    'profile-id': 0,
                    'scalabilityMode': 'L3T3'
                },
            }
            break;
    }

    return { codec, codecOptions }
}

export default getCodecOption
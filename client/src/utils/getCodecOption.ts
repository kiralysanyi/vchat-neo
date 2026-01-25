import type { ProducerCodecOptions, RtpCodecCapability } from "mediasoup-client/types"

const getCodecOption = (codecName: string, highQuality = false): { codec: RtpCodecCapability, codecOptions: ProducerCodecOptions } => {
    let codec: RtpCodecCapability;
    let codecOptions: ProducerCodecOptions = {
        videoGoogleMaxBitrate: highQuality ? 10_000_000 : 3_000_000,
        videoGoogleMinBitrate: highQuality ? 500_000 : 100_000,
        videoGoogleStartBitrate: highQuality ? 1_000_000 : 200_000
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
                    'scalabilityMode': 'L3T3'
                }
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
        default:
            console.log("Defaulted back to VP9");
            codec = {
                preferredPayloadType: 99,
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
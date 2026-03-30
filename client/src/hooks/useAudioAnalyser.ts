import { useEffect, useRef, useState } from 'react'

interface AudioAnalyserState {
  rms: number
  speaking: boolean
  analyser: AnalyserNode | null
}

export function useAudioAnalyser(stream: MediaStream | null, threshold = 0.015) {
  const [state, setState] = useState<AudioAnalyserState>({
    rms: 0, speaking: false, analyser: null
  })
  const rafRef = useRef<number>(undefined)
  const ctxRef = useRef<AudioContext>(undefined)

  useEffect(() => {
    if (!stream) return

    const ac = new AudioContext()
    const src = ac.createMediaStreamSource(stream)
    const analyser = ac.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    src.connect(analyser)
    ctxRef.current = ac

    const buf = new Float32Array(analyser.fftSize)
    const tick = () => {
      analyser.getFloatTimeDomainData(buf)
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length)
      setState({ rms, speaking: rms > threshold, analyser })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current!)
      ac.close()
    }
  }, [stream, threshold])

  return state
}
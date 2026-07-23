import { useAudioAnalyser } from "../hooks/useAudioAnalyser";

const AudioTest = ({ stream }: { stream: MediaStream }) => {
    const stat = useAudioAnalyser(stream);

    return <div className="h-2 bg-blue-500" style={{ width: `${stat.rms * 100}%` }}></div>
}

export default AudioTest;
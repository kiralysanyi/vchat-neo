import { useAudioAnalyser } from "../hooks/useAudioAnalyser";

const Visualizer = ({audioStream}: {audioStream: MediaStream}) => {
    const stat = useAudioAnalyser(audioStream);

    return <div className="w-full h-full transition-all" style={{boxShadow: `inset 0 0px ${stat.speaking ? 80 : 0}px #155dfc`}}></div>
}

export default Visualizer;
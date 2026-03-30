import { useAudioAnalyser } from "../hooks/useAudioAnalyser";

const Visualizer = ({audioStream}: {audioStream: MediaStream}) => {
    const stat = useAudioAnalyser(audioStream);

    return <div className="visualiser" style={{boxShadow: `inset 0 0px ${stat.speaking ? 80 : 0}px #39ff1466`}}>

    </div>
}

export default Visualizer;
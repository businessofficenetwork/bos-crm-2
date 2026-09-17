import { stageClassName, currentStage } from '../lib/stages'
import '../pages/Pipeline.css'

function StageBadge({ claim }) {
  const stage = currentStage(claim)
  if (!stage) {
    return <span className="op-badge op-badge-none">No Pipeline Stage</span>
  }
  return <span className={`op-badge stage-badge ${stageClassName(stage)}`}>{stage}</span>
}

export default StageBadge

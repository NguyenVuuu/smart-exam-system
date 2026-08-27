import { Clock } from 'lucide-react'
import AppNumberInput from '../../../../../components/common/AppNumberInput'
import { Field, StepCard } from '../ExamEditorPrimitives'

export function StepConfig(props: {
  durationMinutes: number
  setDurationMinutes: (value: number) => void
  targetTotalPoints: number
  setTargetTotalPoints: (value: number) => void
}) {
  return (
    <StepCard
      title="Cấu hình đề thi"
      desc="Thiết lập điểm mục tiêu và thời lượng mặc định của đề thi."
      icon={<Clock size={18} className="text-blue-600" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Thời lượng mặc định">
          <AppNumberInput
            value={props.durationMinutes}
            onChange={props.setDurationMinutes}
            suffix="phút"
          />
        </Field>

        <Field label="Tổng điểm mục tiêu">
          <AppNumberInput
            step={0.5}
            value={props.targetTotalPoints}
            onChange={props.setTargetTotalPoints}
          />
        </Field>
      </div>
    </StepCard>
  )
}

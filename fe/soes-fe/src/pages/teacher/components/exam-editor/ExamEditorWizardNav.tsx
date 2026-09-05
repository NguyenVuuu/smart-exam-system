import React from 'react'
import { Check } from 'lucide-react'
import { WIZARD_STEPS, type WizardStepId } from '../../constants/ExamEditorConfig'

interface ExamEditorWizardNavProps {
  activeStep: WizardStepId
  setActiveStep: (step: WizardStepId) => void
}

export const ExamEditorWizardNav: React.FC<ExamEditorWizardNavProps> = ({
  activeStep,
  setActiveStep,
}) => {
  const stepIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStep)

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.id === activeStep
          const isDone = index < stepIndex

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`h-12 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : isDone
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isDone ? <Check size={15} /> : step.icon}
              <span>{step.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

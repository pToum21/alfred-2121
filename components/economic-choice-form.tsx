'use client';

import { EconAnalysisChoice } from './econ-analysis-choice';
import { handleEconomicChoiceAction, FormState } from '@/app/actions';
import { useFormState } from 'react-dom';
import { useEffect } from 'react';

const initialState: FormState = {
  choice: null
};

export function EconomicChoiceForm() {
  const [state, formAction] = useFormState(handleEconomicChoiceAction, initialState);

  useEffect(() => {
    if (state.choice !== null) {
      // Hide the form after submission
      const form = document.querySelector('.economic-choice-wrapper');
      if (form instanceof HTMLElement) {
        form.style.display = 'none';
      }
    }
  }, [state.choice]);

  return (
    <form action={formAction} className="z-50">
      <EconAnalysisChoice />
    </form>
  );
}

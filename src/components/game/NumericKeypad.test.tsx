// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NumericKeypad } from './NumericKeypad'

function renderKeypad(props?: Partial<React.ComponentProps<typeof NumericKeypad>>) {
  const handlers = {
    onDigit: vi.fn(),
    onBackspace: vi.fn(),
    onAutoCorrect: vi.fn(),
    onEnter: vi.fn(),
  }
  render(<NumericKeypad {...handlers} {...props} />)
  return handlers
}

describe('NumericKeypad', () => {
  it('renderiza os dígitos de 0 a 9', () => {
    renderKeypad()
    for (let digit = 0; digit <= 9; digit += 1) {
      expect(screen.getByLabelText(`Dígito ${digit}`)).toBeInTheDocument()
    }
  })

  it('chama onDigit ao clicar em um dígito', () => {
    const handlers = renderKeypad()
    fireEvent.click(screen.getByLabelText('Dígito 5'))
    expect(handlers.onDigit).toHaveBeenCalledWith('5')
  })

  it('chama onEnter e onBackspace', () => {
    const handlers = renderKeypad()
    fireEvent.click(screen.getByLabelText('Confirmar resposta'))
    fireEvent.click(screen.getByLabelText('Apagar dígito'))
    expect(handlers.onEnter).toHaveBeenCalledTimes(1)
    expect(handlers.onBackspace).toHaveBeenCalledTimes(1)
  })

  it('mantém o auto-check indisponível sem cargas', () => {
    renderKeypad({ autoCheckCharges: 0 })
    const autoButton = screen.getByLabelText('Auto acerto indisponível')
    expect(autoButton).toBeDisabled()
  })

  it('exibe a contagem de cargas do auto-check', () => {
    const handlers = renderKeypad({ autoCheckCharges: 2 })
    const autoButton = screen.getByLabelText('Auto acerto (2 usos)')
    expect(autoButton).toBeEnabled()
    fireEvent.click(autoButton)
    expect(handlers.onAutoCorrect).toHaveBeenCalledTimes(1)
  })
})

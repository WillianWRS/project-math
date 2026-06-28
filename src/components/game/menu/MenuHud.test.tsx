// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MenuLevelBadge, MenuPlayButton } from './MenuHud'

describe('MenuHud', () => {
  it('MenuPlayButton dispara onClick', () => {
    const onClick = vi.fn()
    render(<MenuPlayButton onClick={onClick} />)
    fireEvent.click(screen.getByLabelText('Iniciar partida'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('MenuLevelBadge mostra o nível derivado do XP e responde ao clique', () => {
    const onAvatarClick = vi.fn()
    render(
      <MenuLevelBadge xp={0} avatarDataUrl={null} onAvatarClick={onAvatarClick} borderLevel={1} />,
    )
    const badge = screen.getByRole('button', { name: /Nível 1/ })
    fireEvent.click(badge)
    expect(onAvatarClick).toHaveBeenCalledTimes(1)
  })
})

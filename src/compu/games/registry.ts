import type { GameDef } from '../../games/registry'
import { CHALLENGES } from '../challenges'
import { ChallengeGame, CHALLENGE_GAME } from './ChallengeGame'

export const COMPU_GAMES: GameDef[] = [
  {
    id: CHALLENGE_GAME,
    title: 'Desafíos de código',
    icon: '🧩',
    desc: 'Problemas para resolver con Java, HTML y CSS. El sistema prueba tu código solo.',
    max: `${CHALLENGES.length} desafíos × 100`,
    levels: CHALLENGES.map((c) => c.id),
    component: ChallengeGame,
  },
]

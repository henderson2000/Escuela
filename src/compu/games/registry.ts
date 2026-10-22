import type { GameDef } from '../../games/registry'
import { CHALLENGES } from '../challenges'
import { ChallengeGame, CHALLENGE_GAME } from './ChallengeGame'
import { QuizCompu, QUIZ_POOL_SIZE } from './QuizCompu'

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
  {
    id: 'compu-quiz',
    title: '¿Qué hace este código?',
    icon: '❓',
    desc: `Preguntas rápidas de HTML, CSS y Java: qué se ve, qué color queda, qué imprime. ${QUIZ_POOL_SIZE} preguntas distintas.`,
    max: '200',
    component: QuizCompu,
  },
]

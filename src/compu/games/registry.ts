import type { GameDef } from '../../games/registry'
import { CHALLENGES } from '../challenges'
import { ChallengeGame, CHALLENGE_GAME } from './ChallengeGame'
import { QuizCompu, QUIZ_POOL_SIZE } from './QuizCompu'

export const COMPU_GAMES: GameDef[] = [
  {
    id: CHALLENGE_GAME,
    title: 'Desafíos de código',
    icon: '🧩',
    desc: 'Problemas para resolver con HTML y JavaScript. El sistema prueba tu código solo.',
    max: `${CHALLENGES.length} desafíos × 100`,
    levels: CHALLENGES.map((c) => c.id),
    component: ChallengeGame,
  },
  {
    id: 'compu-quiz',
    title: '¿Qué hace este código?',
    icon: '❓',
    desc: `Preguntas rápidas de HTML y JavaScript: qué se ve, qué muestra la consola, qué hace cada instrucción. ${QUIZ_POOL_SIZE} preguntas distintas.`,
    max: '200',
    component: QuizCompu,
  },
]

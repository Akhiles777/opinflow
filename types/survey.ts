export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'SCALE'
  | 'MATRIX'
  | 'RANKING'
  | 'OPEN_TEXT'

export type LogicRule = {
  ifQuestionId: string
  operator: 'equals' | 'not_equals' | 'contains'
  value: string
  action: 'show' | 'hide'
}

export type Question = {
  id: string
  type: QuestionType
  title: string
  description: string
  required: boolean
  mediaUrl: string | null
  options: string[]
  matrixRows: string[]
  matrixCols: string[]
  settings: Record<string, any>
  logic: LogicRule[]
}

export type SurveyDraft = {
  title: string
  description: string
  category: string
  questions: Question[]
  targetGender: 'any' | 'male' | 'female'
  targetAgeMin: number
  targetAgeMax: number
  targetCities: string[]
  targetIncomes: string[]
  targetInterests: string[]
  maxResponses: number
  reward: number
  startsAt: string
  endsAt: string
}

export const EMPTY_DRAFT: SurveyDraft = {
  title: '',
  description: '',
  category: '',
  questions: [],
  targetGender: 'any',
  targetAgeMin: 18,
  targetAgeMax: 65,
  targetCities: [],
  targetIncomes: [],
  targetInterests: [],
  maxResponses: 50,
  reward: 50,
  startsAt: new Date().toISOString().split('T')[0],
  endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Одиночный выбор',
  MULTIPLE_CHOICE: 'Множественный выбор',
  SCALE: 'Шкала оценки',
  MATRIX: 'Матрица',
  RANKING: 'Ранжирование',
  OPEN_TEXT: 'Открытый ответ',
}

export function createEmptyQuestion(type: QuestionType): Question {
  const base: Question = {
    id: crypto.randomUUID(),
    type,
    title: '',
    description: '',
    required: true,
    mediaUrl: null,
    options: [],
    matrixRows: [],
    matrixCols: [],
    settings: {},
    logic: [],
  }

  switch (type) {
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return { ...base, options: ['Вариант 1', 'Вариант 2', 'Вариант 3'] }
    case 'RANKING':
      return { ...base, options: ['Элемент 1', 'Элемент 2', 'Элемент 3'] }
    case 'SCALE':
      return {
        ...base,
        settings: {
          min: 1,
          max: 10,
          minLabel: 'Совсем нет',
          maxLabel: 'Определённо да',
        },
      }
    case 'MATRIX':
      return {
        ...base,
        matrixRows: ['Критерий 1', 'Критерий 2'],
        matrixCols: ['Плохо', 'Нейтрально', 'Хорошо'],
      }
    case 'OPEN_TEXT':
      return {
        ...base,
        settings: {
          maxLength: 500,
          placeholder: 'Введите ваш ответ...',
        },
      }
    default:
      return base
  }
}

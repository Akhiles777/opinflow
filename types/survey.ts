

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'SCALE'
  | 'MATRIX'
  | 'RANKING'
  | 'OPEN_TEXT'


  export type LogicRule = {
  ifQuestionId: string    // ID вопроса на который смотрим
  operator:     'equals' | 'not_equals' | 'contains'
  value:        string    // Значение для сравнения
  action:       'show' | 'hide'  // Что делать с текущим вопросом
}

export type QuestionSettings =
  | { min: number; max: number; minLabel?: string; maxLabel?: string }  // SCALE
  | { maxLength: number; placeholder?: string }                          // OPEN_TEXT
  | Record<string, never>                                                // остальные

  export type Question = {
  id:          string           // временный uuid, заменяется на cuid после сохранения
  type:        QuestionType
  title:       string
  description: string
  required:    boolean
  mediaUrl:    string | null
  options:     string[]         // для SINGLE, MULTIPLE, RANKING
  matrixRows:  string[]         // для MATRIX
  matrixCols:  string[]         // для MATRIX
  settings:    QuestionSettings
  logic:       LogicRule[]
}


export type SurveyDraft = {
  // Шаг 1
  title:       string
  description: string
  category:    string

  // Шаг 2
  questions: Question[]

  // Шаг 3
  targetGender:    'any' | 'male' | 'female'
  targetAgeMin:    number   // 18
  targetAgeMax:    number   // 99
  targetCities:    string[]
  targetIncomes:   string[]
  targetInterests: string[]

  // Шаг 4
  maxResponses:  number   // минимум 10
  reward:        number   // минимум 20 ₽
  startsAt:      string   // ISO строка даты
  endsAt:        string   // ISO строка даты
}


export const EMPTY_DRAFT: SurveyDraft = {
  title:           '',
  description:     '',
  category:        '',
  questions:       [],
  targetGender:    'any',
  targetAgeMin:    18,
  targetAgeMax:    65,
  targetCities:    [],
  targetIncomes:   [],
  targetInterests: [],
  maxResponses:    50,
  reward:          50,
  startsAt:        new Date().toISOString().split('T')[0],
  endsAt:          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}


export function createEmptyQuestion(type: QuestionType): Question {
  const base = {
    id:          crypto.randomUUID(),
    type,
    title:       '',
    description: '',
    required:    true,
    mediaUrl:    null,
    options:     [],
    matrixRows:  [],
    matrixCols:  [],
    settings:    {} as QuestionSettings,
    logic:       [],
  }
    switch (type) {
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return { ...base, options: ['Вариант 1', 'Вариант 2'] }

    case 'RANKING':
      return { ...base, options: ['Элемент 1', 'Элемент 2', 'Элемент 3'] }

    case 'SCALE':
      return { ...base, settings: { min: 1, max: 5, minLabel: 'Плохо', maxLabel: 'Отлично' } }

    case 'MATRIX':
      return {
        ...base,
        matrixRows: ['Критерий 1', 'Критерий 2'],
        matrixCols: ['Плохо', 'Нейтрально', 'Хорошо'],
      }

    case 'OPEN_TEXT':
      return { ...base, settings: { maxLength: 500, placeholder: 'Введите ваш ответ...' } }

    default:
      return base
  }
}


export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE:   'Одиночный выбор',
  MULTIPLE_CHOICE: 'Множественный выбор',
  SCALE:           'Шкала оценки',
  MATRIX:          'Матрица',
  RANKING:         'Ранжирование',
  OPEN_TEXT:       'Открытый ответ',
}


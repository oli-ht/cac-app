export type ElementType = 'article' | 'video' | 'funFact' | 'quiz' | 'question';
export type QuizQuestionType = 'multipleChoice' | 'trueFalse' | 'multiSelect' | 'matching' | 'fillInBlank' | 'ordering';

export interface QuizQuestion {
  id: string;
  questionType: QuizQuestionType;
  question: string;
  // For multiple choice, true/false, multi-select
  options?: string[];
  correctAnswer?: number; // For multiple choice and true/false
  correctAnswers?: number[]; // For multi-select
  // For matching
  pairs?: { left: string; right: string }[];
  // For fill in the blank
  correctText?: string;
  caseSensitive?: boolean;
  // For ordering
  correctOrder?: string[];
}

export interface CourseElement {
  id: string;
  type: ElementType;
  title: string;
  content: string;
  order: number;
  // For videos
  videoUrl?: string;
  // For quizzes
  questions?: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
  // For fun facts
  imageUrl?: string;
  // For articles with glossary
  glossary?: {
    term: string;
    definition: string;
  }[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  elements: CourseElement[];
  published: boolean;
  userId: string;
}

export type ElementType = 'article' | 'video' | 'funFact' | 'quiz' | 'question';

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

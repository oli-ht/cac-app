export interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  category: string;
  description: string;
  isNew?: boolean;
  isPopular?: boolean;
  slides: Slide[];
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'quiz';
  quizOptions?: string[];
  correctAnswer?: number;
} 
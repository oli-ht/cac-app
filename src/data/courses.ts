// This file contains our actual course data
// We import the Course type to make sure our data matches the structure we defined
import { Course } from '../types/course';

// This is our main data array - it contains all the courses in our app
export const coursesData: Course[] = [
  // First course: Vaccinations
  {
    id: '1',                                    // Unique ID for this course
    title: 'Vaccinations',                      // Course title
    instructor: 'Dr. John Doe',                 // Who teaches it
    duration: '16 hours',                       // How long it takes
    category: 'Disease',                        // What category it belongs to
    description: 'Learn about different types of vaccines, their importance, and safety protocols.',
    isNew: true,                                // Mark as a new course
    slides: [                                   // Array of 5 slides for this course
      {
        id: '1-1',                              // Slide 1 ID (course 1, slide 1)
        title: 'Introduction to Vaccines',      // Slide title
        content: 'Vaccines are biological preparations that provide active acquired immunity to a particular infectious disease. They typically contain an agent that resembles a disease-causing microorganism.',
        type: 'text'                            // This is a text-only slide
      },
      {
        id: '1-2',                              // Slide 2 ID
        title: 'Types of Vaccines',             // Slide title
        content: 'There are several types of vaccines: Live-attenuated vaccines, Inactivated vaccines, Subunit vaccines, Toxoid vaccines, and mRNA vaccines.',
        type: 'text'                            // Another text slide
      },
      {
        id: '1-3',                              // Slide 3 ID
        title: 'Vaccine Safety',                // Slide title
        content: 'All vaccines undergo rigorous safety testing before approval. Common side effects are usually mild and temporary.',
        type: 'text'                            // Text slide
      },
      {
        id: '1-4',                              // Slide 4 ID
        title: 'Vaccination Schedule',          // Slide title
        content: 'Understanding the recommended vaccination schedule for different age groups and populations.',
        type: 'text'                            // Text slide
      },
      {
        id: '1-5',                              // Slide 5 ID (the quiz)
        title: 'Quiz: Vaccine Knowledge',       // Quiz title
        content: 'Test your understanding of vaccine basics',  // Quiz instructions
        type: 'quiz',                           // This is a quiz slide
        quizOptions: [                          // Array of possible answers
          'Vaccines contain live viruses',
          'Vaccines are completely safe with no side effects',
          'Vaccines help prevent infectious diseases',  // This is the correct answer
          'Vaccines are not necessary for healthy individuals'
        ],
        correctAnswer: 2                        // Index 2 (third option) is correct
      }
    ]
  },
  
  // Second course: Reproductive Health
  {
    id: '2',                                    // Course ID
    title: 'Reproductive Health',               // Course title
    instructor: 'Dr. Jane Doe',                 // Instructor
    duration: '16 hours',                       // Duration
    category: 'Health',                         // Category
    description: 'Comprehensive guide to reproductive health, family planning, and sexual wellness.',
    isPopular: true,                            // Mark as popular
    slides: [                                   // 5 slides for this course
      {
        id: '2-1',                              // Course 2, slide 1
        title: 'Understanding Reproductive Health',
        content: 'Reproductive health encompasses physical, mental, and social well-being in all matters relating to the reproductive system.',
        type: 'text'
      },
      {
        id: '2-2',                              // Course 2, slide 2
        title: 'Family Planning Methods',
        content: 'Various contraceptive methods including barrier methods, hormonal contraceptives, and permanent methods.',
        type: 'text'
      },
      {
        id: '2-3',                              // Course 2, slide 3
        title: 'Sexual Health Education',
        content: 'Importance of sexual health education, STI prevention, and safe practices.',
        type: 'text'
      },
      {
        id: '2-4',                              // Course 2, slide 4
        title: 'Pregnancy and Prenatal Care',
        content: 'Essential information about pregnancy, prenatal care, and maternal health.',
        type: 'text'
      },
      {
        id: '2-5',                              // Course 2, slide 5 (quiz)
        title: 'Quiz: Reproductive Health',
        content: 'Test your knowledge about reproductive health',
        type: 'quiz',
        quizOptions: [
          'Reproductive health only concerns physical health',
          'Family planning is only for married couples',
          'Sexual health education is important for everyone',  // Correct answer
          'Prenatal care is optional during pregnancy'
        ],
        correctAnswer: 2                        // Third option is correct
      }
    ]
  },
  
  // Third course: Eye Care
  {
    id: '3',                                    // Course ID
    title: 'Eye Care',                          // Course title
    instructor: 'Dr. John Doe',                 // Instructor
    duration: '14 hours',                       // Duration
    category: 'Health',                         // Category
    description: 'Essential knowledge about eye health, common conditions, and preventive care.',
    slides: [                                   // 5 slides for this course
      {
        id: '3-1',                              // Course 3, slide 1
        title: 'Eye Anatomy Basics',
        content: 'Understanding the structure of the eye including cornea, lens, retina, and optic nerve.',
        type: 'text'
      },
      {
        id: '3-2',                              // Course 3, slide 2
        title: 'Common Eye Conditions',
        content: 'Myopia, hyperopia, astigmatism, cataracts, and glaucoma - their causes and symptoms.',
        type: 'text'
      },
      {
        id: '3-3',                              // Course 3, slide 3
        title: 'Eye Care Practices',
        content: 'Daily practices for maintaining good eye health including proper lighting, screen time management, and eye exercises.',
        type: 'text'
      },
      {
        id: '3-4',                              // Course 3, slide 4
        title: 'When to See an Eye Doctor',
        content: 'Warning signs and symptoms that require professional eye care attention.',
        type: 'text'
      },
      {
        id: '3-5',                              // Course 3, slide 5 (quiz)
        title: 'Quiz: Eye Health',
        content: 'Test your knowledge about eye care',
        type: 'quiz',
        quizOptions: [
          'Reading in dim light improves eyesight',
          'Regular eye exams are important for everyone',  // Correct answer
          'Eye strain from screens is permanent',
          'Wearing glasses makes vision worse'
        ],
        correctAnswer: 1                        // Second option is correct
      }
    ]
  }
]; 
/**
 * Demo data for showcase mode
 * This provides sample schedule and assignment data for users who want to try the app
 * without providing their own ICS URLs
 * 
 * Note: Classes don't have startDate/endDate so they always appear regardless of current date
 */

// Helper to create classes for every weekday
const createDemoClass = (id: string, courseName: string, courseCode: string, color: string, day: number, startTime: string, endTime: string, location: string, instructor: string, description?: string, type: string = 'Lecture') => {
  // Parse times to calculate duration (handle both 12-hour and 24-hour formats)
  const parseTime = (time: string) => {
    const parts = time.split(' ');
    if (parts.length === 2) {
      // 12-hour format with AM/PM
      const [timePart, period] = parts;
      const [hours, minutes] = timePart.split(':').map(Number);
      const hour24 = period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours;
      return hour24 * 60 + (minutes || 0);
    } else {
      // 24-hour format
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    }
  };
  
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  const duration = (endMinutes - startMinutes) / 60;
  
  return {
    id,
    courseName,
    courseCode,
    courseColor: color,
    day,
    startTime,
    endTime,
    location,
    instructor,
    type: 'class',
    sessionType: type,
    duration,
    title: `${courseName} - ${location}`,
    description: description || `${courseName} class with ${instructor}`,
    campus: 'Kerr Hall',
    credits: '0.5',
    status: 'Enrolled'
  };
};

export const DEMO_SCHEDULE_DATA = {
  classes: [
    // Monday (day 2) - 2 classes
    createDemoClass("demo-cps714-mon", "CPS714", "CPS714", "#3b82f6", 2, "9:00 AM", "11:00 AM", "VIC 202", "Dr. Emily Smith", "Advanced Algorithm Design - Covering dynamic programming, greedy algorithms, divide & conquer, and graph algorithms. Focus on problem-solving techniques and complexity analysis.", "Lecture"),
    createDemoClass("demo-cps843-mon", "CPS843", "CPS843", "#f59e0b", 2, "6:00 PM", "9:00 PM", "KHE 340", "Dr. Raj Patel", "Introduction to Machine Learning - Neural networks, deep learning fundamentals, supervised and unsupervised learning. Hands-on projects with Python, TensorFlow, and scikit-learn.", "Lecture"),
    
    // Tuesday (day 3) - 2 classes
    createDemoClass("demo-cps510-tue", "CPS510", "CPS510", "#10b981", 3, "8:00 AM", "10:00 AM", "KHE 225", "Dr. Wei Chen", "Database Systems - Comprehensive coverage of SQL, NoSQL, database design principles, normalization, transactions, and ACID properties. Real-world database optimization techniques.", "Lecture"),
    createDemoClass("demo-pol507-tue", "POL507", "POL507", "#ec4899", 3, "4:00 PM", "7:00 PM", "JOR 301", "Prof. Maria Martinez", "Canadian Politics - Exploring federal and provincial governance structures, constitutional law, political parties, electoral systems, and current policy debates.", "Seminar"),
    
    // Wednesday (day 4) - 2 classes
    createDemoClass("demo-coe70a-wed", "COE70A", "COE70A", "#06b6d4", 4, "3:00 PM", "5:00 PM", "ENG 206", "Prof. James Anderson", "Engineering Capstone Project I - Planning, designing, and executing your final engineering project. Weekly progress reviews and technical documentation.", "Workshop"),
    createDemoClass("demo-cps510-wed", "CPS510", "CPS510", "#10b981", 4, "6:00 PM", "8:00 PM", "KHE 225", "Dr. Wei Chen", "Database Systems Evening Session - Advanced topics including distributed databases, data warehousing, and big data technologies. Project work and case studies.", "Tutorial"),
    
    // Thursday (day 5) - 3 classes
    createDemoClass("demo-cps843-thu-lab", "CPS843 Lab", "CPS843", "#f59e0b", 5, "10:00 AM", "1:00 PM", "KHE 340", "TA Sarah Lee", "ML Lab - Implementing classification and regression models with Python. Hands-on experience with TensorFlow, Keras, data preprocessing, and model evaluation.", "Lab"),
    createDemoClass("demo-pol507-thu", "POL507", "POL507", "#ec4899", 5, "2:00 PM", "4:00 PM", "JOR 301", "Prof. Maria Martinez", "Political Theory Discussion - Engaging debates on democratic theory, federalism, and contemporary Canadian political issues. Student-led presentations.", "Discussion"),
    createDemoClass("demo-coe70a-thu", "COE70A", "COE70A", "#06b6d4", 5, "6:00 PM", "8:00 PM", "ENG 206", "Prof. James Anderson", "Capstone Progress Reviews - Team presentations, peer feedback sessions, and technical problem-solving workshops.", "Workshop"),
    
    // Friday (day 6) - 2 classes
    createDemoClass("demo-cps510-fri-lab", "CPS510 Lab", "CPS510", "#10b981", 6, "1:00 PM", "3:00 PM", "KHE 225", "TA Michael Robinson", "Database Lab - Query optimization, indexing strategies, stored procedures, and performance tuning exercises using real-world datasets.", "Lab"),
    createDemoClass("demo-cps843-fri", "CPS843", "CPS843", "#f59e0b", 6, "5:00 PM", "7:00 PM", "KHE 340", "Dr. Raj Patel", "ML Lecture - Reinforcement learning, Q-learning, neural architecture search, and practical applications in robotics and game AI.", "Lecture"),
  ],
  
  assignments: [
    // CPS714 - Advanced Algorithm Design
    {
      id: "demo-assignment-1",
      title: "Algorithm Analysis Report",
      course: "CPS714",
      courseName: "Advanced Algorithm Design",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Comprehensive analysis of time and space complexity for major sorting algorithms. Implement quicksort, mergesort, and heapsort in C++. Include empirical testing on datasets ranging from 1K to 1M elements. Produce performance graphs and theoretical analysis comparing best, average, and worst-case scenarios.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "CPS714 - Advanced Algorithm Design"
    },
    {
      id: "Lab9 - Due-CPS714",
      title: "Lab9 - Due",
      course: "CPS714",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      status: "Not Started" as const
    },
    
    // CPS843 - Introduction to Computer Vision
    {
      id: "HW-1-CPS843",
      title: "HW-1",
      course: "CPS843",
      courseName: "Introduction to Computer Vision",
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Train and evaluate multiple classification models using scikit-learn on the Iris dataset. Compare decision trees, random forests, SVM, and k-NN. Implement cross-validation, hyperparameter tuning using GridSearchCV, and generate confusion matrices. Report precision, recall, and F1 scores for each model.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "CPS843 - Introduction to Computer Vision"
    },
    {
      id: "Quiz#1-CPS843",
      title: "Quiz#1 - Availability Ends",
      course: "CPS843",
      courseName: "Introduction to Computer Vision",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "CPS843 - Introduction to Computer Vision"
    },
    
    // POL507 - Power, Change and Technology
    {
      id: "Reflection#1-POL507",
      title: "Reflection#1",
      course: "POL507",
      courseName: "Power, Change and Technology",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Critical reflection on weekly readings and class discussions. 500-750 words analyzing key themes and their contemporary relevance.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "POL507 - Power, Change and Technology"
    },
    {
      id: "Reflection#2-POL507",
      title: "Reflection#2",
      course: "POL507",
      courseName: "Power, Change and Technology",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "POL507 - Power, Change and Technology"
    },
    {
      id: "Book Review-POL507",
      title: "Book Review",
      course: "POL507",
      courseName: "Power, Change and Technology",
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "low" as const,
      description: "Comprehensive book review of assigned text. 2000-2500 words analyzing main arguments, methodology, and contributions to the field.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "POL507 - Power, Change and Technology"
    },
    
    // COE70A - Engineering Capstone
    {
      id: "Fall MCR-1-COE70A",
      title: "Fall MCR-1",
      course: "COE70A",
      courseName: "Computer Engineering Capstone Design-A",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Monthly Checkpoint Report documenting project progress, challenges, and next steps. Include technical diagrams and milestone completion status.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone"
    },
    {
      id: "Fall MCR-2-COE70A",
      title: "Fall MCR-2",
      course: "COE70A",
      courseName: "Computer Engineering Capstone Design-A",
      dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone"
    },
    {
      id: "Fall MCR-3-COE70A",
      title: "Fall MCR-3",
      course: "COE70A",
      courseName: "Computer Engineering Capstone Design-A",
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone"
    },
    {
      id: "Fall MCR-4-COE70A",
      title: "Fall MCR-4",
      course: "COE70A",
      courseName: "Computer Engineering Capstone Design-A",
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "low" as const,
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone"
    },
    {
      id: "Microcontrollers Quiz-COE70A",
      title: "Microcontrollers Quiz - Due",
      course: "COE70A",
      courseName: "Computer Engineering Capstone Design-A",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone"
    },
    {
      id: "Establishment-COE70A",
      title: "Establishment of Fall Milestones - All phases",
      course: "COE70A",
      courseName: "Computer Engineering Capstone Design-A",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Define and document all project milestones for the fall semester. Include deliverables, deadlines, and success criteria for each phase.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone"
    }
  ]
};

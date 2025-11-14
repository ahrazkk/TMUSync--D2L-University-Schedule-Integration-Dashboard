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
      id: "demo-assignment-2",
      title: "Graph Algorithm Implementation",
      course: "CPS714",
      courseName: "Advanced Algorithm Design",
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Implement Dijkstra's shortest path and A* pathfinding algorithms from scratch. Create interactive visualization showing algorithm execution step-by-step. Compare performance on various graph structures (sparse, dense, weighted). Bonus: Implement Bellman-Ford for negative edge weights.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "CPS714 - Advanced Algorithm Design"
    },
    {
      id: "demo-assignment-3-cps714",
      title: "Dynamic Programming Challenge Set",
      course: "CPS714",
      courseName: "Advanced Algorithm Design",
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "low" as const,
      description: "Solve 10 advanced dynamic programming problems including knapsack variants, longest common subsequence, matrix chain multiplication, and edit distance. Provide detailed explanations of recurrence relations and memoization strategies.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "CPS714 - Advanced Algorithm Design"
    },
    
    // CPS510 - Database Systems
    {
      id: "demo-assignment-3",
      title: "Database Design Project",
      course: "CPS510",
      courseName: "Database Systems",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Design and implement a complete relational database for an e-commerce platform. Deliverables: ER diagrams with cardinality constraints, normalized schema (3NF minimum), SQL DDL scripts, 20+ sample queries including complex joins, subqueries, and aggregations. Document indexing strategy and include transaction examples.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "CPS510 - Database Systems"
    },
    {
      id: "demo-assignment-4",
      title: "SQL Query Optimization",
      course: "CPS510",
      courseName: "Database Systems",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Optimize 5 provided slow queries running on a 10GB dataset. Use EXPLAIN ANALYZE to identify bottlenecks. Apply appropriate indexes, rewrite queries, and analyze execution plans. Document before/after performance metrics with response time improvements.",
      status: "Completed" as const,
      source: 'ICS' as const,
      location: "CPS510 - Database Systems"
    },
    {
      id: "demo-assignment-5",
      title: "NoSQL vs SQL Comparison",
      course: "CPS510",
      courseName: "Database Systems",
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "low" as const,
      description: "Research paper (2500-3000 words) comparing MongoDB and PostgreSQL for different use cases. Include performance benchmarks for read/write operations, scalability analysis, and data modeling differences. Provide code samples demonstrating CRUD operations in both systems.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "CPS510 - Database Systems"
    },
    
    // CPS843 - Introduction to Machine Learning
    {
      id: "demo-assignment-10",
      title: "Classification Model Training",
      course: "CPS843",
      courseName: "Introduction to Machine Learning",
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Train and evaluate multiple classification models using scikit-learn on the Iris dataset. Compare decision trees, random forests, SVM, and k-NN. Implement cross-validation, hyperparameter tuning using GridSearchCV, and generate confusion matrices. Report precision, recall, and F1 scores for each model.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "CPS843 - Introduction to Machine Learning"
    },
    {
      id: "demo-assignment-11",
      title: "Deep Learning Project",
      course: "CPS843",
      courseName: "Introduction to Machine Learning",
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Build a convolutional neural network (CNN) for image classification using TensorFlow or PyTorch. Train on CIFAR-10 dataset. Implement data augmentation, dropout regularization, and learning rate scheduling. Achieve minimum 75% test accuracy. Document architecture choices and training process.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "CPS843 - Introduction to Machine Learning"
    },
    {
      id: "demo-assignment-11-cps843",
      title: "Neural Network From Scratch",
      course: "CPS843",
      courseName: "Introduction to Machine Learning",
      dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Implement a basic neural network from scratch using only NumPy (no ML frameworks). Include forward propagation, backpropagation, and gradient descent. Train on XOR problem and visualize decision boundaries. Explain mathematical derivations of gradients.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "CPS843 - Introduction to Machine Learning"
    },
    
    // POL507 - Canadian Politics
    {
      id: "demo-assignment-12",
      title: "Policy Analysis Paper",
      course: "POL507",
      courseName: "Canadian Politics",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Critical analysis of a recent Canadian federal policy (2020-2024) and its impact on provincial governance and intergovernmental relations. 2500-3000 words. Must include analysis of stakeholder positions, constitutional considerations, and policy outcomes. Minimum 12 academic sources.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "POL507 - Canadian Politics"
    },
    {
      id: "demo-assignment-13",
      title: "Parliamentary Debate Presentation",
      course: "POL507",
      courseName: "Canadian Politics",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Prepare and deliver a 15-minute presentation analyzing a current parliamentary debate topic (Bill C-11, healthcare funding, or climate policy). Present both government and opposition perspectives. Include Q&A session. Submit presentation slides and speaking notes.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "POL507 - Canadian Politics"
    },
    {
      id: "demo-assignment-13-pol507",
      title: "Electoral Systems Comparison",
      course: "POL507",
      courseName: "Canadian Politics",
      dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "low" as const,
      description: "Comparative essay examining Canada's First-Past-the-Post system versus proportional representation alternatives. Analyze effects on party representation, regional disparities, and voter turnout. Include case studies from recent federal elections. 2000-2500 words.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "POL507 - Canadian Politics"
    },
    
    // COE70A - Engineering Capstone Project
    {
      id: "demo-assignment-14",
      title: "Project Proposal",
      course: "COE70A",
      courseName: "Engineering Capstone Project I",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Submit detailed capstone project proposal (15-20 pages) including: project objectives, technical requirements, methodology, timeline with milestones, resource requirements, risk analysis, and expected outcomes. Include preliminary research, feasibility analysis, and budget breakdown. Must be approved by faculty advisor.",
      status: "In Progress" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone Project I"
    },
    {
      id: "demo-assignment-15",
      title: "Literature Review",
      course: "COE70A",
      courseName: "Engineering Capstone Project I",
      dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Comprehensive literature review of existing solutions, technologies, and research related to your capstone project domain. Minimum 20 peer-reviewed sources including journal articles, conference papers, and industry reports. Identify gaps in current solutions and justify your project's contribution. 3000-4000 words.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone Project I"
    },
    {
      id: "demo-assignment-15-coe70a",
      title: "Technical Prototype Demo",
      course: "COE70A",
      courseName: "Engineering Capstone Project I",
      dueDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Develop and present a working prototype demonstrating core functionality of your capstone project. Prepare 10-minute demo with technical documentation. Address feasibility concerns and gather feedback from faculty panel. Submit source code and system architecture diagrams.",
      status: "Not Started" as const,
      source: 'ICS' as const,
      location: "COE70A - Engineering Capstone Project I"
    }
  ]
};

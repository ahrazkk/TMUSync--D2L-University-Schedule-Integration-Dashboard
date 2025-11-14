/**
 * Demo data for showcase mode
 * This provides sample schedule and assignment data for users who want to try the app
 * without providing their own ICS URLs
 * 
 * Note: Classes don't have startDate/endDate so they always appear regardless of current date
 */

// Helper to create classes for every weekday
const createDemoClass = (id: string, courseName: string, courseCode: string, color: string, day: number, startTime: string, endTime: string, location: string, instructor: string, description?: string) => {
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
    duration,
    title: `${courseName} - ${location}`,
    description: description || `${courseName} class with ${instructor}`
  };
};

export const DEMO_SCHEDULE_DATA = {
  classes: [
    // Monday (day 2) - 2 classes
    createDemoClass("demo-cps714-mon", "CPS714", "CPS714", "#3b82f6", 2, "9:00 AM", "11:00 AM", "VIC 202", "Dr. Smith", "Advanced Algorithm Design - Covering dynamic programming and graph algorithms"),
    createDemoClass("demo-cps843-mon", "CPS843", "CPS843", "#f59e0b", 2, "6:00 PM", "9:00 PM", "KHE 340", "Dr. Patel", "Introduction to Machine Learning - Neural networks and deep learning fundamentals"),
    
    // Tuesday (day 3) - 2 classes
    createDemoClass("demo-cps510-tue", "CPS510", "CPS510", "#10b981", 3, "8:00 AM", "10:00 AM", "KHE 225", "Dr. Chen", "Database Systems - SQL, NoSQL, and database design principles"),
    createDemoClass("demo-pol507-tue", "POL507", "POL507", "#ec4899", 3, "4:00 PM", "7:00 PM", "JOR 301", "Prof. Martinez", "Canadian Politics - Exploring federal and provincial governance structures"),
    
    // Wednesday (day 4) - 2 classes
    createDemoClass("demo-coe70a-wed", "COE70A", "COE70A", "#06b6d4", 4, "3:00 PM", "5:00 PM", "ENG 206", "Prof. Anderson", "Engineering Capstone Project I - Planning and designing your final project"),
    createDemoClass("demo-cps510-wed", "CPS510", "CPS510", "#10b981", 4, "6:00 PM", "8:00 PM", "KHE 225", "Dr. Chen", "Database Systems Evening Session - Advanced topics and project work"),
    
    // Thursday (day 5) - 3 classes
    createDemoClass("demo-cps843-thu-lab", "CPS843 Lab", "CPS843", "#f59e0b", 5, "10:00 AM", "1:00 PM", "KHE 340", "TA Lee", "ML Lab - Implementing classification models with Python and TensorFlow"),
    createDemoClass("demo-pol507-thu", "POL507", "POL507", "#ec4899", 5, "2:00 PM", "4:00 PM", "JOR 301", "Prof. Martinez", "Political theory discussion and debate session"),
    createDemoClass("demo-coe70a-thu", "COE70A", "COE70A", "#06b6d4", 5, "6:00 PM", "8:00 PM", "ENG 206", "Prof. Anderson", "Capstone progress presentations and peer feedback"),
    
    // Friday (day 6) - 2 classes
    createDemoClass("demo-cps510-fri-lab", "CPS510 Lab", "CPS510", "#10b981", 6, "1:00 PM", "3:00 PM", "KHE 225", "TA Robinson", "Database Lab - Query optimization and indexing exercises"),
    createDemoClass("demo-cps843-fri", "CPS843", "CPS843", "#f59e0b", 6, "5:00 PM", "7:00 PM", "KHE 340", "Dr. Patel", "ML lecture on reinforcement learning and practical applications"),
  ],
  
  assignments: [
    // CPS714 - Advanced Algorithm Design
    {
      id: "demo-assignment-1",
      title: "Algorithm Analysis Report",
      course: "CPS714",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Analyze time complexity of sorting algorithms with empirical testing. Compare quicksort, mergesort, and heapsort on various input sizes.",
      status: "In Progress" as const
    },
    {
      id: "demo-assignment-2",
      title: "Graph Algorithm Implementation",
      course: "CPS714",
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Implement Dijkstra's and A* pathfinding algorithms. Include visualization and performance comparison.",
      status: "Not Started" as const
    },
    
    // CPS510 - Database Systems
    {
      id: "demo-assignment-3",
      title: "Database Design Project",
      course: "CPS510",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Design and implement a relational database for an e-commerce platform. Include ER diagrams, normalization, and sample queries.",
      status: "In Progress" as const
    },
    {
      id: "demo-assignment-4",
      title: "SQL Query Optimization",
      course: "CPS510",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Optimize provided slow queries using indexes, query rewriting, and execution plan analysis.",
      status: "Completed" as const
    },
    {
      id: "demo-assignment-5",
      title: "NoSQL vs SQL Comparison",
      course: "CPS510",
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "low" as const,
      description: "Research paper comparing MongoDB and PostgreSQL for different use cases. Include performance benchmarks.",
      status: "Not Started" as const
    },
    
    // CPS630 - Web Systems Development
    
    // CPS843 - Introduction to Machine Learning
    {
      id: "demo-assignment-10",
      title: "Classification Model Training",
      course: "CPS843",
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Train and evaluate classification models using scikit-learn. Compare decision trees, SVM, and neural networks.",
      status: "In Progress" as const
    },
    {
      id: "demo-assignment-11",
      title: "Deep Learning Project",
      course: "CPS843",
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Build a convolutional neural network for image classification using TensorFlow or PyTorch.",
      status: "Not Started" as const
    },
    
    // POL507 - Canadian Politics
    {
      id: "demo-assignment-12",
      title: "Policy Analysis Paper",
      course: "POL507",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Analyze a recent Canadian federal policy and its impact on provincial governance. 2000-2500 words.",
      status: "Not Started" as const
    },
    {
      id: "demo-assignment-13",
      title: "Parliamentary Debate Presentation",
      course: "POL507",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Prepare and deliver a 15-minute presentation on a current parliamentary debate topic.",
      status: "In Progress" as const
    },
    
    // COE70A - Engineering Capstone Project
    {
      id: "demo-assignment-14",
      title: "Project Proposal",
      course: "COE70A",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "high" as const,
      description: "Submit detailed capstone project proposal including objectives, methodology, timeline, and resource requirements.",
      status: "In Progress" as const
    },
    {
      id: "demo-assignment-15",
      title: "Literature Review",
      course: "COE70A",
      dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium" as const,
      description: "Comprehensive literature review of existing solutions related to your capstone project. Minimum 15 sources.",
      status: "Not Started" as const
    }
  ]
};

import { Course, Assignment, CourseSession } from './user-storage';

export const DEMO_USER_ID = 'demo-user-ahraz';

export const DEMO_USER_PROFILE = {
    email: 'demo@tmusync.com',
    firstName: 'Demo Student',
    icsUrls: {
        d2l: 'https://demo.d2l.url/calendar.ics',
        googleCalendar: 'https://demo.google.url/calendar.ics'
    },
    preferences: {
        auroraIntensity: 20,
        noiseOpacity: 17, // Requested by user in previous turn
        enableSpotlight: true
    }
};

// Helper to create dates relative to today
const getRelativeDate = (daysOffset: number, hour: number, minute: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
};

const getRelativeDateOnly = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
};

export const DEMO_COURSES: Course[] = [
    // Pattern 1: 3 hours long (Single block)
    {
        key: 'CPS847',
        name: 'Software Tools for Startups',
        code: 'CPS847',
        weeklyHours: 4, // 3 Lec + 1 Lab
        color: '#FF5733',
        description: 'This course is designed to equip students with the essential technical and product management skills required to build and scale early-stage startups. The curriculum covers the entire product lifecycle, from ideation and rapid prototyping to MVP development and iterative testing. Students will learn to use modern software stacks (MERN/Next.js), deployment pipelines (CI/CD), and collaboration tools used in high-growth tech companies. Guest lectures from industry founders and hands-on hackathons are key components of the course.',
        sessions: [
            { day: 1, startTime: '18:00', endTime: '21:00', type: 'lecture', location: 'ENG 103' }, // Mon 6-9pm
            { day: 3, startTime: '16:00', endTime: '17:00', type: 'lab', location: 'ENG 103' }     // Wed 4-5pm
        ]
    },
    {
        key: 'CPS714',
        name: 'Advanced Software Engineering',
        code: 'CPS714',
        weeklyHours: 5, // 3 Lec + 2 Lab
        color: '#3357FF',
        description: 'An in-depth exploration of enterprise-grade software development. This course focuses on architectural patterns (Microservices, Hexagonal), design principles (SOLID, DRY), and the management of technical debt in legacy systems. Students will work in large teams to refactor and extend substantial open-source codebases, simulating real-world engineering environments. Topics also include advanced testing strategies, containerization with Docker/Kubernetes, and cloud-native design.',
        sessions: [
            { day: 3, startTime: '08:00', endTime: '11:00', type: 'lecture', location: 'DSQ 11' }, // Wed 8-11am
            { day: 5, startTime: '09:00', endTime: '11:00', type: 'lab', location: 'DSQ 11' }      // Fri 9-11am
        ]
    },
    // Pattern 2: Split sessions (2 hours + 1 hour)
    {
        key: 'CPS843',
        name: 'Computer Vision',
        code: 'CPS843',
        weeklyHours: 4, // 2+1 Lec + 1 Lab
        color: '#33FF57',
        description: 'A comprehensive introduction to computer vision algorithms and applications. The course begins with fundamental image processing techniques (filtering, edge detection) and progresses to modern deep learning approaches (CNNs, Transformers) for object detection, segmentation, and facial recognition. Lab sessions involve implementing these algorithms using Python, OpenCV, and PyTorch. The final project requires students to build a real-time vision system.',
        sessions: [
            { day: 2, startTime: '10:00', endTime: '12:00', type: 'lecture', location: 'VIC 205' }, // Tue 10-12
            { day: 4, startTime: '11:00', endTime: '12:00', type: 'lecture', location: 'VIC 205' }, // Thu 11-12
            { day: 2, startTime: '12:00', endTime: '13:00', type: 'lab', location: 'VIC 208' }      // Tue 12-1
        ]
    },
    {
        key: 'GEO110',
        name: 'The Physical Environment',
        code: 'GEO110',
        weeklyHours: 4, // 2+1 Lec + 1 Lab
        color: '#F333FF',
        description: 'This course surveys the Earth’s major physical systems—atmosphere, hydrosphere, lithosphere, and biosphere—and their complex interactions. We examine global climate patterns, tectonic processes, soil formation, and ecosystem dynamics. Special emphasis is placed on the impact of human activity on these systems, including climate change and resource depletion. Labs include map analysis, remote sensing data interpretation, and field studies.',
        sessions: [
            { day: 1, startTime: '13:00', endTime: '15:00', type: 'lecture', location: 'TRS 1067' }, // Mon 1-3pm
            { day: 4, startTime: '13:00', endTime: '14:00', type: 'lecture', location: 'TRS 1067' }, // Thu 1-2pm
            { day: 4, startTime: '14:00', endTime: '15:00', type: 'lab', location: 'TRS 1067' }      // Thu 2-3pm
        ]
    },
    // Pattern 3: Single 2 hour long class
    {
        key: 'MTH108',
        name: 'Linear Algebra',
        code: 'MTH108',
        weeklyHours: 3, // 2 Lec + 1 Lab
        color: '#FF33A8',
        description: 'A foundational mathematics course essential for computer science and engineering. Topics include systems of linear equations, matrix algebra, determinants, vector spaces, linear transformations, eigenvalues, and eigenvectors. The specific applications of these concepts to computer graphics, machine learning, and network analysis are highlighted throughout the course. Tutorials focus on problem-solving and proof techniques.',
        sessions: [
            { day: 5, startTime: '13:00', endTime: '15:00', type: 'lecture', location: 'KHE 123' },  // Fri 1-3pm
            { day: 3, startTime: '12:00', endTime: '13:00', type: 'tutorial', location: 'KHE 123' } // Wed 12-1pm
        ]
    }
];

export const DEMO_ASSIGNMENTS: Assignment[] = [
    // CPS847 - Software Tools for Startups
    {
        id: 'demo-assign-1',
        title: 'Startup Pitch Deck Presentation',
        dueDate: getRelativeDate(3, 23, 59),
        course: 'CPS847',
        courseName: 'Software Tools for Startups',
        description: 'Prepare a 10-minute pitch deck for your MVP. Include problem statement, solution, market analysis, and go-to-market strategy.',
        source: 'ics',
        priority: 'high'
    },
    {
        id: 'demo-assign-2',
        title: 'MVP Sprint 2 Deliverable',
        dueDate: getRelativeDate(7, 18, 0),
        course: 'CPS847',
        courseName: 'Software Tools for Startups',
        description: 'Submit working prototype with core features. Must include user authentication and main user flow.',
        source: 'ics',
        priority: 'high'
    },
    // CPS714 - Advanced Software Engineering
    {
        id: 'demo-assign-3',
        title: 'Microservices Architecture Design',
        dueDate: getRelativeDate(5, 23, 59),
        course: 'CPS714',
        courseName: 'Advanced Software Engineering',
        description: 'Design a microservices architecture for the provided monolithic application. Include service boundaries, API contracts, and data flow diagrams.',
        source: 'ics',
        priority: 'high'
    },
    {
        id: 'demo-assign-4',
        title: 'Code Review Report',
        dueDate: getRelativeDate(10, 17, 0),
        course: 'CPS714',
        courseName: 'Advanced Software Engineering',
        description: 'Conduct a peer code review and submit a detailed report with findings, suggestions, and SOLID principle violations.',
        source: 'ics',
        priority: 'medium'
    },
    // CPS843 - Computer Vision
    {
        id: 'demo-assign-5',
        title: 'Edge Detection Implementation',
        dueDate: getRelativeDate(4, 23, 59),
        course: 'CPS843',
        courseName: 'Computer Vision',
        description: 'Implement Canny edge detection from scratch using NumPy. Compare results with OpenCV implementation.',
        source: 'ics',
        priority: 'medium'
    },
    {
        id: 'demo-assign-6',
        title: 'Object Detection Final Project',
        dueDate: getRelativeDate(14, 23, 59),
        course: 'CPS843',
        courseName: 'Computer Vision',
        description: 'Build a real-time object detection system using YOLO or Faster R-CNN. Must achieve >70% mAP on test dataset.',
        source: 'ics',
        priority: 'high'
    },
    // GEO110 - The Physical Environment
    {
        id: 'demo-assign-7',
        title: 'Climate Data Analysis Lab',
        dueDate: getRelativeDate(2, 14, 0),
        course: 'GEO110',
        courseName: 'The Physical Environment',
        description: 'Analyze 50 years of temperature data for Toronto. Create visualizations and identify trends related to climate change.',
        source: 'ics',
        priority: 'medium'
    },
    {
        id: 'demo-assign-8',
        title: 'Field Study Report',
        dueDate: getRelativeDate(12, 23, 59),
        course: 'GEO110',
        courseName: 'The Physical Environment',
        description: 'Submit field study observations from the Don Valley trip. Include soil samples analysis and ecosystem assessment.',
        source: 'ics',
        priority: 'low'
    },
    // MTH108 - Linear Algebra
    {
        id: 'demo-assign-9',
        title: 'Problem Set 5: Eigenvalues',
        dueDate: getRelativeDate(1, 17, 0),
        course: 'MTH108',
        courseName: 'Linear Algebra',
        description: 'Complete problems 1-15 from Chapter 6. Show all work for eigenvalue and eigenvector calculations.',
        source: 'ics',
        priority: 'high'
    },
    {
        id: 'demo-assign-10',
        title: 'Linear Transformations Quiz',
        dueDate: getRelativeDate(8, 10, 0),
        course: 'MTH108',
        courseName: 'Linear Algebra',
        description: 'Online quiz covering linear transformations, kernel, and image. 45 minutes, open book.',
        source: 'ics',
        priority: 'medium'
    }
];

// Helper to generate Class Events for the calendar (Single Reference Week)
export const generateDemoClassEvents = () => {
    const events: any[] = [];
    const today = new Date();
    // Start from last Sunday to establish a reference week
    const startObj = new Date(today);
    startObj.setDate(today.getDate() - today.getDay());

    // Generate just ONE week of events (The frontend treats these as recurring weekly templates)
    DEMO_COURSES.forEach(course => {
        course.sessions.forEach(session => {
            const eventDate = new Date(startObj);
            eventDate.setDate(eventDate.getDate() + session.day);

            // Parse time
            const [startH, startM] = session.startTime.split(':').map(Number);
            const [endH, endM] = session.endTime.split(':').map(Number);

            const startDate = new Date(eventDate);
            startDate.setHours(startH, startM, 0, 0);

            const endDate = new Date(eventDate);
            endDate.setHours(endH, endM, 0, 0);

            // Format 12h time
            const startH12 = startH % 12 || 12;
            const startAmPm = startH < 12 ? 'AM' : 'PM';
            const startMStr = startM.toString().padStart(2, '0');
            const startTimeFormatted = `${startH12}:${startMStr} ${startAmPm}`;

            events.push({
                id: `${course.key}-${session.day}-${session.type}`, // Unique ID per session type per day
                title: `${course.code} - ${session.type.charAt(0).toUpperCase() + session.type.slice(1)}`,
                course: course.key,
                courseName: course.name,
                courseDescription: course.description, // Link course description to events
                color: course.color, // Ensure labs and lectures share the same color
                startTime: startDate.toISOString(),
                startTimeFormatted: startTimeFormatted, // EXPLICIT FORMAT for frontend
                endDate: endDate.toISOString(),
                location: session.location,
                description: `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} session for ${course.name}`,
                dayOfWeek: session.day,
                type: 'class', // Explicitly needed for frontend distinction
                sessionType: session.type, // lecture, lab, or tutorial
                duration: (endH - startH) + (endM - startM) / 60
            });
        });
    });
    return events;
};

export const DEMO_CLASS_EVENTS = generateDemoClassEvents();

export const DEMO_ASSIGNMENT_STATES = {};

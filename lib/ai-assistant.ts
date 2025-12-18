/**
 * AI Assistant Library
 * Provides AI-powered features using the Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export interface AIConfig {
    apiKey: string;
    model?: string;
}

export interface AssignmentAnalysis {
    suggestedPriority: 'low' | 'medium' | 'high';
    estimatedHours: number;
    suggestedCourse: string | null;
    description: string;
    tags: string[];
}

export interface ClassDescription {
    description: string;
    topics: string[];
    studyTips: string[];
}

// Priority keywords
const PRIORITY_KEYWORDS = {
    high: ['final', 'midterm', 'exam', 'presentation', 'project', 'thesis', 'major'],
    medium: ['quiz', 'test', 'report', 'lab', 'homework', 'assignment'],
    low: ['reading', 'discussion', 'practice', 'review', 'optional', 'bonus'],
};

/**
 * Analyze assignment title to suggest priority
 */
export function detectPriority(title: string): 'low' | 'medium' | 'high' {
    const titleLower = title.toLowerCase();

    for (const keyword of PRIORITY_KEYWORDS.high) {
        if (titleLower.includes(keyword)) return 'high';
    }

    for (const keyword of PRIORITY_KEYWORDS.medium) {
        if (titleLower.includes(keyword)) return 'medium';
    }

    for (const keyword of PRIORITY_KEYWORDS.low) {
        if (titleLower.includes(keyword)) return 'low';
    }

    return 'medium'; // Default
}

/**
 * Estimate study hours based on assignment type
 */
export function estimateStudyHours(title: string): number {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('final') || titleLower.includes('exam')) return 8;
    if (titleLower.includes('midterm')) return 6;
    if (titleLower.includes('project')) return 10;
    if (titleLower.includes('presentation')) return 4;
    if (titleLower.includes('report')) return 4;
    if (titleLower.includes('lab')) return 3;
    if (titleLower.includes('quiz')) return 2;
    if (titleLower.includes('homework') || titleLower.includes('assignment')) return 3;
    if (titleLower.includes('reading')) return 1;

    return 2; // Default
}

/**
 * Extract course code from assignment title
 */
export function extractCourseCode(title: string): string | null {
    const match = title.match(/([A-Z]{2,4}\s?\d{2,3}[A-Z]?)/i);
    return match ? match[1].toUpperCase().replace(/\s/g, '') : null;
}

/**
 * Generate tags from assignment title
 */
export function generateTags(title: string): string[] {
    const tags: string[] = [];
    const titleLower = title.toLowerCase();

    if (titleLower.includes('exam') || titleLower.includes('midterm') || titleLower.includes('final')) {
        tags.push('exam');
    }
    if (titleLower.includes('project')) tags.push('project');
    if (titleLower.includes('lab')) tags.push('lab');
    if (titleLower.includes('quiz')) tags.push('quiz');
    if (titleLower.includes('presentation')) tags.push('presentation');
    if (titleLower.includes('report')) tags.push('report');
    if (titleLower.includes('group')) tags.push('group-work');
    if (titleLower.includes('individual')) tags.push('individual');

    return tags;
}

/**
 * AI-powered assignment analysis (requires API key)
 */
export async function analyzeAssignment(
    config: AIConfig,
    title: string,
    courses: string[]
): Promise<AssignmentAnalysis> {
    // First, try basic analysis
    const basicAnalysis: AssignmentAnalysis = {
        suggestedPriority: detectPriority(title),
        estimatedHours: estimateStudyHours(title),
        suggestedCourse: extractCourseCode(title),
        description: '',
        tags: generateTags(title),
    };

    // If no API key, return basic analysis
    if (!config.apiKey) {
        return basicAnalysis;
    }

    try {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: config.model || 'gemini-pro' });

        const prompt = `Analyze this university assignment:
Title: "${title}"
Available courses: ${courses.join(', ')}

Respond in JSON format with:
{
  "description": "Brief description of what this assignment likely involves (1-2 sentences)",
  "suggestedCourse": "Best matching course code from the list, or null",
  "studyTips": "One helpful study tip"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const aiAnalysis = JSON.parse(jsonMatch[0]);
            return {
                ...basicAnalysis,
                description: aiAnalysis.description || '',
                suggestedCourse: aiAnalysis.suggestedCourse || basicAnalysis.suggestedCourse,
            };
        }
    } catch (error) {
        console.error('AI Analysis failed:', error);
    }

    return basicAnalysis;
}

/**
 * AI-powered class description generator
 */
export async function generateClassDescription(
    config: AIConfig,
    classTitle: string
): Promise<ClassDescription | null> {
    if (!config.apiKey) {
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: config.model || 'gemini-pro' });

        const prompt = `For this university class: "${classTitle}"
Generate a helpful description in JSON format:
{
  "description": "Brief 1-2 sentence description of what this class covers",
  "topics": ["topic1", "topic2", "topic3"],
  "studyTips": ["tip1", "tip2"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('AI Description generation failed:', error);
    }

    return null;
}

/**
 * AI-powered chat assistant
 */
export async function chatWithAssistant(
    config: AIConfig,
    message: string,
    context: {
        assignments?: any[];
        classes?: any[];
        userName?: string;
    }
): Promise<string> {
    if (!config.apiKey) {
        return "Please configure your Gemini API key in Settings > AI Configuration to use the AI assistant.";
    }

    try {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: config.model || 'gemini-pro' });

        // Build context
        let systemContext = `You are a helpful academic assistant for a university student${context.userName ? ` named ${context.userName}` : ''}.`;

        if (context.assignments?.length) {
            systemContext += `\n\nUpcoming assignments: ${context.assignments.slice(0, 5).map(a => `${a.title} (due ${a.dueDate})`).join(', ')}`;
        }

        if (context.classes?.length) {
            const uniqueClasses = [...new Set(context.classes.map(c => c.title))].slice(0, 5);
            systemContext += `\n\nCurrent classes: ${uniqueClasses.join(', ')}`;
        }

        const prompt = `${systemContext}\n\nUser: ${message}\n\nProvide a helpful, concise response:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('AI Chat failed:', error);
        return `I encountered an error: ${error.message || 'Unknown error'}. Please check your API key in settings.`;
    }
}

// Check if API key is configured
export function isAIConfigured(): boolean {
    if (typeof window === 'undefined') return false;
    const key = localStorage.getItem('gemini_api_key');
    return !!key && key.length > 0;
}

// Get saved API key
export function getAIConfig(): AIConfig {
    if (typeof window === 'undefined') return { apiKey: '' };
    return {
        apiKey: localStorage.getItem('gemini_api_key') || '',
        model: localStorage.getItem('gemini_model') || 'gemini-pro',
    };
}

// Save API key
export function saveAIConfig(config: AIConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('gemini_api_key', config.apiKey);
    if (config.model) {
        localStorage.setItem('gemini_model', config.model);
    }
}

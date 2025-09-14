// Minimal type declarations for node-ical
// Place this file in your project to avoid TypeScript errors when importing node-ical

declare module 'node-ical' {
  export interface ICalEvent {
    type: string;
    summary?: string;
    start?: Date | string;
    [key: string]: any;
  }

  export function parseICS(data: string): Record<string, ICalEvent>;
}

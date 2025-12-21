"use client";

import { createContext, useContext, useEffect, useState } from 'react';

interface Preferences {
    auroraIntensity: number; // 0-100
    noiseOpacity: number; // 0-100
    enableSpotlight: boolean;
}

interface AppearanceContextType {
    preferences: Preferences;
    updatePreferences: (newPrefs: Partial<Preferences>) => void;
    savePreferences: () => Promise<void>;
    isLoaded: boolean;
}

const AppearanceContext = createContext<AppearanceContextType>({
    preferences: { auroraIntensity: 60, noiseOpacity: 30, enableSpotlight: false },
    updatePreferences: () => { },
    savePreferences: async () => { },
    isLoaded: false,
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    // Detect browser window size to set responsive defaults
    const getResponsiveDefaults = (): Preferences => {
        // Check if we're in browser (not SSR)
        if (typeof window === 'undefined') {
            return { auroraIntensity: 52, noiseOpacity: 81, enableSpotlight: false };
        }

        // Use window.innerWidth for actual browser window width
        const browserWidth = window.innerWidth;

        // Also check if it's a touch device (mobile/tablet)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Mobile/Tablets: typically < 1024px width or touch devices on small screens
        // User requested: 78% aurora, 100% grain
        if (browserWidth < 1024 || (isTouchDevice && browserWidth < 1280)) {
            return { auroraIntensity: 78, noiseOpacity: 100, enableSpotlight: false };
        }

        // Large monitors (23"+): typically 1920px+ browser window width
        // Keep lower intensity to avoid overwhelming brightness
        if (browserWidth >= 1920) {
            return { auroraIntensity: 15, noiseOpacity: 25, enableSpotlight: false };
        }

        // Laptops under 20 inch: 1024px to 1919px
        // User requested: 52% aurora, 81% grain
        return { auroraIntensity: 52, noiseOpacity: 81, enableSpotlight: false };
    };

    const [preferences, setPreferences] = useState<Preferences>(() => getResponsiveDefaults());
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch on mount - only apply saved preferences if they exist
    useEffect(() => {
        async function loadPreferences() {
            try {
                const res = await fetch('/api/user/data');
                if (res.ok) {
                    const data = await res.json();
                    // Only use saved preferences if they actually exist and have values
                    if (data.preferences &&
                        typeof data.preferences.auroraIntensity === 'number' &&
                        typeof data.preferences.noiseOpacity === 'number') {
                        setPreferences(data.preferences);
                    }
                    // If no preferences saved, keep the responsive defaults
                }
            } catch (error) {
                console.error('Failed to load appearance preferences');
            } finally {
                setIsLoaded(true);
            }
        }
        loadPreferences();
    }, []);

    // Update CSS variables
    useEffect(() => {
        const root = document.documentElement;
        // Aurora: 0-100 -> 0.0 to 1.0 opacity multiplier (base logic in CSS handled via variable)
        // We update --aurora-opacity variable
        root.style.setProperty('--aurora-opacity', (preferences.auroraIntensity / 100).toString());

        // Noise: 0-100 -> 0.0 to 0.15 (approx)
        // 30 -> 0.03
        root.style.setProperty('--noise-opacity', (preferences.noiseOpacity / 1000).toString());

        if (preferences.enableSpotlight) {
            document.body.classList.add('spotlight-active');
        } else {
            document.body.classList.remove('spotlight-active');
        }
    }, [preferences]);

    // Global Mouse Tracker (for Spotlight & Magnetic Borders)
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        };

        // Add listener immediately
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []); // Run once on mount

    const updatePreferences = (newPrefs: Partial<Preferences>) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
    };

    const savePreferences = async () => {
        try {
            await fetch('/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
        } catch (error) {
            console.error('Failed to save preferences', error);
            throw error;
        }
    };

    return (
        <AppearanceContext.Provider value={{ preferences, updatePreferences, savePreferences, isLoaded }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export const useAppearance = () => useContext(AppearanceContext);

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
    const [preferences, setPreferences] = useState<Preferences>({
        auroraIntensity: 15,
        noiseOpacity: 25,
        enableSpotlight: false
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch on mount
    useEffect(() => {
        async function loadPreferences() {
            try {
                const res = await fetch('/api/user/data');
                if (res.ok) {
                    const data = await res.json();
                    if (data.preferences) {
                        setPreferences(data.preferences);
                    }
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

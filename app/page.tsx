"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ThemeToggle } from "@/components/theme-toggle";

import { ChaosOverlay } from "@/components/ui/chaos-overlay";

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    const [mouseX, setMouseX] = useState(0.5); // 0 to 1, center is 0.5
    const [flickerOpacity, setFlickerOpacity] = useState(1);
    const flickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const flickerIntervalRef = useRef<number>(5000); // Start at 5 seconds

    // Flicker function - briefly dims the spotlight
    const triggerFlicker = useCallback(() => {
        // Quick flicker: dim to 30%, then back to full
        setFlickerOpacity(0.3);
        setTimeout(() => setFlickerOpacity(1), 80);
        setTimeout(() => {
            setFlickerOpacity(0.5);
            setTimeout(() => setFlickerOpacity(1), 60);
        }, 150);
    }, []);

    // Schedule next random flicker with exponential backoff
    const scheduleNextFlicker = useCallback(() => {
        // Random delay between current interval and 1.5x the interval
        const nextDelay = flickerIntervalRef.current + Math.random() * flickerIntervalRef.current * 0.5;

        flickerTimeoutRef.current = setTimeout(() => {
            triggerFlicker();
            // Increase interval with backoff (max 30 seconds)
            flickerIntervalRef.current = Math.min(flickerIntervalRef.current * 1.3, 30000);
            scheduleNextFlicker();
        }, nextDelay);
    }, [triggerFlicker]);

    useEffect(() => {
        setMounted(true);

        // Initial flicker burst on load (after a short delay)
        const initialFlickerTimeout = setTimeout(() => {
            triggerFlicker();
            setTimeout(triggerFlicker, 400);
            setTimeout(triggerFlicker, 900);
            // Start periodic random flickers after initial burst
            setTimeout(scheduleNextFlicker, 2000);
        }, 800);

        // Mouse tracking for subtle spotlight movement
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse X to 0-1 range
            const normalizedX = e.clientX / window.innerWidth;
            setMouseX(normalizedX);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(initialFlickerTimeout);
            if (flickerTimeoutRef.current) {
                clearTimeout(flickerTimeoutRef.current);
            }
        };
    }, [triggerFlicker, scheduleNextFlicker]);

    // Calculate subtle rotation for spotlight (±5 degrees)
    const spotlightRotation = (mouseX - 0.5) * 10; // -5 to +5 degrees

    return (
        <BackgroundGrid className="flex flex-col items-center justify-center relative">
            <div className="bg-noise bg-noise-home" />
            <ChaosOverlay />

            {/* Editorial Navigation */}
            <nav className="absolute top-0 w-full p-6 md:p-10 flex justify-between items-center z-50 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="text-xl md:text-2xl font-serif font-bold tracking-tighter text-foreground">
                    TMUSYNC<span className="text-primary">.</span>
                </div>
                <div className="flex gap-6 text-xs md:text-sm font-mono tracking-widest uppercase text-muted-foreground items-center">
                    <Link href="/login" className="hover:text-foreground transition-colors hover:underline decoration-1 underline-offset-4">LOGIN</Link>
                    <Link href="/signup" className="hover:text-foreground transition-colors hover:underline decoration-1 underline-offset-4">JOIN</Link>
                    <ThemeToggle />
                </div>
            </nav>

            {/* Hero Section - reduced top padding to move content up */}
            <main className="flex flex-col items-center text-center max-w-6xl mx-auto px-4 z-10 space-y-8 md:space-y-12 pt-16 md:pt-20 pb-32">

                {/* Abstract Badge */}
                <div className={`transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-background/50 backdrop-blur-sm text-[10px] md:text-xs font-mono font-medium text-primary tracking-[0.2em] uppercase">
                        v2.0 / SYSTEM_ACTIVE
                    </span>
                </div>

                {/* Main Headline with Spotlight */}
                <div className="space-y-6 md:space-y-8 relative">
                    {/* Stage spotlight cone - comes from bottom, widens at text, rotates slightly with mouse */}
                    <div
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-0 transition-all duration-500 ease-out"
                        style={{
                            width: '100vw',
                            height: '100vh',
                            background: 'linear-gradient(to top, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.07) 35%, rgba(255, 255, 255, 0.04) 50%, transparent 70%)',
                            clipPath: 'polygon(45% 100%, 55% 100%, 85% 30%, 15% 30%)',
                            filter: 'blur(20px)',
                            transformOrigin: 'center bottom',
                            transform: `translateX(-50%) rotate(${spotlightRotation}deg)`,
                            opacity: flickerOpacity,
                            transition: 'transform 0.5s ease-out, opacity 0.08s ease-out',
                        }}
                    />
                    {/* Inner brighter cone */}
                    <div
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-0 transition-all duration-500 ease-out"
                        style={{
                            width: '100vw',
                            height: '100vh',
                            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 65%)',
                            clipPath: 'polygon(47% 100%, 53% 100%, 75% 35%, 25% 35%)',
                            filter: 'blur(15px)',
                            transformOrigin: 'center bottom',
                            transform: `translateX(-50%) rotate(${spotlightRotation * 0.7}deg)`,
                            opacity: flickerOpacity,
                            transition: 'transform 0.5s ease-out, opacity 0.08s ease-out',
                        }}
                    />
                    {/* Glow at the text area */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(255, 255, 255, 0.06) 0%, transparent 60%)',
                            filter: 'blur(25px)',
                        }}
                    />
                    <h1 className={`relative text-6xl md:text-9xl lg:text-[11rem] leading-[0.85] font-serif font-bold tracking-tighter text-foreground transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <span className="block">Chaos.</span>
                        <span className="block italic font-light text-muted-foreground ml-4 md:ml-24">
                            Ordered.
                        </span>
                    </h1>
                    <p className={`relative pt-6 md:pt-8 text-xs md:text-sm font-mono text-muted-foreground max-w-xl mx-auto tracking-wide leading-relaxed uppercase transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        The university dashboard. <br />
                        Assignments, schedules, and analytics—unified in a single, breathing interface.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-6 pt-4 md:pt-6 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                    <Link href="/api/auth/demo">
                        <MagneticButton size="lg" className="h-14 px-10 text-sm md:text-base rounded-none border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:shadow-[4px_4px_0px_0px_var(--primary)] transition-all">
                            ENTER DEMO MODE
                        </MagneticButton>
                    </Link>
                    <Link href="/login">
                        <MagneticButton size="lg" className="h-14 px-10 text-sm md:text-base rounded-none border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:shadow-[4px_4px_0px_0px_var(--primary)] transition-all">
                            STUDENT LOGIN
                        </MagneticButton>
                    </Link>
                </div>

            </main>

            {/* Structured Feature Grid - Now part of flow on small screens, fixed on large if space permits, but safer as relative for now */}
            <div className={`w-full border-t border-white/10 bg-background/50 backdrop-blur-md transition-all duration-1000 delay-[1200ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 max-w-8xl mx-auto">

                    <div className="p-8 md:p-12 flex flex-col gap-4 hover:bg-white/5 transition-colors cursor-default group">
                        <div className="text-xs font-mono text-muted-foreground">[01]</div>
                        <h3 className="font-serif font-bold text-2xl md:text-3xl">Automated Sync</h3>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono leading-relaxed">Instantly scrapes VSB & D2L for complete schedule integration.</p>
                    </div>

                    <div className="p-8 md:p-12 flex flex-col gap-4 hover:bg-white/5 transition-colors cursor-default group">
                        <div className="text-xs font-mono text-muted-foreground">[02]</div>
                        <h3 className="font-serif font-bold text-2xl md:text-3xl">End-to-End Encrypted</h3>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono leading-relaxed">Your credentials never leave local memory. Zero servers.</p>
                    </div>

                    <div className="p-8 md:p-12 flex flex-col gap-4 hover:bg-white/5 transition-colors cursor-default group">
                        <div className="text-xs font-mono text-muted-foreground">[03]</div>
                        <h3 className="font-serif font-bold text-2xl md:text-3xl">Cinematic UI</h3>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono leading-relaxed">Magnetic interactions, aurora lighting, and editorial typography.</p>
                    </div>

                </div>
            </div>

        </BackgroundGrid>
    );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ThemeToggle } from "@/components/theme-toggle";

import { ChaosOverlay } from "@/components/ui/chaos-overlay";

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

            {/* Hero Section */}
            <main className="flex flex-col items-center text-center max-w-6xl mx-auto px-4 z-10 space-y-12 md:space-y-16 pt-24 md:pt-32 pb-40">

                {/* Abstract Badge */}
                <div className={`transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-flex items-center gap-2 px-3 py-1 border border-primary/20 bg-background/50 backdrop-blur-sm text-[10px] md:text-xs font-mono font-medium text-primary tracking-[0.2em] uppercase">
                        v2.0 / SYSTEM_ACTIVE
                    </span>
                </div>

                {/* Main Headline */}
                <div className="space-y-6 md:space-y-8">
                    <h1 className={`text-6xl md:text-9xl lg:text-[11rem] leading-[0.85] font-serif font-bold tracking-tighter text-foreground transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <span className="block">Chaos.</span>
                        <span className="block italic font-light text-muted-foreground ml-12 md:ml-24">
                            Ordered.
                        </span>
                    </h1>
                    <p className={`pt-8 md:pt-12 text-xs md:text-sm font-mono text-muted-foreground max-w-xl mx-auto tracking-wide leading-relaxed uppercase transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        The university dashboard. <br />
                        Assignments, schedules, and analytics—unified in a single, breathing interface.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-6 pt-8 md:pt-12 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                    <Link href="/api/auth/demo">
                        <MagneticButton size="lg" className="h-14 px-10 text-sm md:text-base rounded-none border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:shadow-[4px_4px_0px_0px_var(--primary)] transition-all">
                            ENTER DEMO MODE
                        </MagneticButton>
                    </Link>
                    <Link href="/login">
                        <MagneticButton variant="outline" size="lg" className="h-14 px-10 text-sm md:text-base rounded-none border-foreground/20 hover:bg-foreground/5">
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

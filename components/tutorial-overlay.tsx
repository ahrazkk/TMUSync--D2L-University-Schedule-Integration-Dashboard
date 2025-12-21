"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface TutorialStep {
    id: string;
    target: string; // data-tutorial attribute value
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right";
    allowInteraction?: boolean; // Allow user to interact with highlighted element
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "stats-cards",
        target: "stats-cards",
        title: "Interactive Stats Cards",
        description: "Try it now! Hover over these cards to flip them and reveal detailed breakdowns of your weekly hours, assignments, and courses.",
        position: "bottom",
        allowInteraction: true, // Allow hovering
    },
    {
        id: "weekly-calendar",
        target: "weekly-calendar",
        title: "Your Weekly Schedule",
        description: "View all your enrolled classes here. Click on any class to see its details, schedule, and related assignments.",
        position: "top",
        allowInteraction: true,
    },
    {
        id: "assignments-panel",
        target: "assignments-panel",
        title: "Assignments Tracker",
        description: "Track upcoming and completed assignments. Click to view details or mark them as done with a single click.",
        position: "left",
        allowInteraction: true,
    },
    {
        id: "visual-settings-tip",
        target: "stats-cards", // Reuse stats-cards as the target since there's no specific settings element on dashboard
        title: "Customize Your Experience ✨",
        description: "Head to Settings to adjust the Aurora Lighting and Film Grain effects. We've set optimal defaults for your device, but you can fine-tune them to match your personal preference or reduce visual intensity.",
        position: "bottom",
        allowInteraction: false,
    },
];

interface TutorialOverlayProps {
    onComplete: () => void;
    isDemo?: boolean;
}

export function TutorialOverlay({ onComplete, isDemo = false }: TutorialOverlayProps) {
    const [showWelcome, setShowWelcome] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isActive, setIsActive] = useState(false);

    // Find and highlight the target element
    const updateTargetPosition = useCallback(() => {
        if (!isActive || currentStep >= TUTORIAL_STEPS.length) return;

        const step = TUTORIAL_STEPS[currentStep];
        const element = document.querySelector(`[data-tutorial="${step.target}"]`);

        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
        }
    }, [currentStep, isActive]);

    useEffect(() => {
        updateTargetPosition();
        window.addEventListener("resize", updateTargetPosition);
        window.addEventListener("scroll", updateTargetPosition);

        return () => {
            window.removeEventListener("resize", updateTargetPosition);
            window.removeEventListener("scroll", updateTargetPosition);
        };
    }, [updateTargetPosition]);

    const handleStartTutorial = () => {
        setShowWelcome(false);
        setIsActive(true);
    };

    const handleSkip = () => {
        setIsActive(false);
        onComplete();
    };

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSkip();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Calculate tooltip position based on target and preference
    const getTooltipStyle = () => {
        if (!targetRect) return {};

        const padding = 20;
        const tooltipWidth = 340;

        // Default to bottom positioning
        let top = targetRect.bottom + padding;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

        // Ensure tooltip stays within viewport
        if (left < padding) left = padding;
        if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }

        // If tooltip would go below viewport, position it above
        if (top + 200 > window.innerHeight) {
            top = targetRect.top - 200 - padding;
        }

        return { top, left, width: tooltipWidth };
    };

    // Welcome modal - Dark themed
    if (showWelcome) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative max-w-md mx-4 p-8 bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-violet-500/20 shadow-2xl shadow-violet-500/10"
                    >
                        {/* Glossy icon */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-800/70 to-purple-950/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-violet-900/30 border border-violet-600/20">
                                <Sparkles className="w-10 h-10 text-violet-300/80" />
                            </div>
                        </div>

                        <div className="mt-8 text-center space-y-4">
                            <h2 className="text-2xl font-serif font-bold text-white">
                                Welcome to TMUSync!
                            </h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Would you like a quick tour of the dashboard? We'll show you where everything is and how to make the most of your experience.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <Button
                                onClick={handleStartTutorial}
                                className="w-full h-12 bg-gradient-to-r from-violet-800/80 to-purple-900/80 hover:from-violet-700/90 hover:to-purple-800/90 text-violet-200 rounded-xl font-medium border border-violet-600/20 backdrop-blur-sm shadow-lg shadow-violet-900/20"
                            >
                                Start Quick Tour
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleSkip}
                                className="w-full h-10 text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            >
                                Skip for now
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Tutorial steps with spotlight
    if (!isActive || currentStep >= TUTORIAL_STEPS.length) return null;

    const step = TUTORIAL_STEPS[currentStep];
    const tooltipStyle = getTooltipStyle();

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Blurred dark overlay - pointer-events-none so clicks pass through */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-none"
                style={{
                    clipPath: targetRect
                        ? `polygon(
                            0% 0%, 
                            0% 100%, 
                            ${targetRect.left - 12}px 100%, 
                            ${targetRect.left - 12}px ${targetRect.top - 12}px, 
                            ${targetRect.right + 12}px ${targetRect.top - 12}px, 
                            ${targetRect.right + 12}px ${targetRect.bottom + 12}px, 
                            ${targetRect.left - 12}px ${targetRect.bottom + 12}px, 
                            ${targetRect.left - 12}px 100%, 
                            100% 100%, 
                            100% 0%
                        )`
                        : undefined
                }}
            />

            {/* Spotlight border glow */}
            {targetRect && (
                <motion.div
                    key={`spotlight-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute rounded-xl border-2 border-violet-400/60 shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                    style={{
                        left: targetRect.left - 12,
                        top: targetRect.top - 12,
                        width: targetRect.width + 24,
                        height: targetRect.height + 24,
                        pointerEvents: step.allowInteraction ? 'none' : 'auto',
                    }}
                />
            )}

            {/* Interactive area - allows clicking/hovering through to the element */}
            {targetRect && step.allowInteraction && (
                <div
                    className="absolute"
                    style={{
                        left: targetRect.left - 12,
                        top: targetRect.top - 12,
                        width: targetRect.width + 24,
                        height: targetRect.height + 24,
                        pointerEvents: 'none', // Let events pass through
                    }}
                />
            )}

            {/* Tooltip card - Dark themed */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute bg-zinc-900/95 backdrop-blur-2xl rounded-xl border border-violet-500/20 shadow-2xl shadow-violet-500/10 p-5"
                style={tooltipStyle}
            >
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4 text-zinc-400" />
                </button>

                {/* Step indicator */}
                <div className="text-xs text-violet-400/80 font-medium mb-2">
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </div>

                {/* Step content */}
                <div className="pr-8">
                    <h3 className="font-serif font-bold text-lg text-white">
                        {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                        {step.description}
                    </p>
                    {step.allowInteraction && (
                        <p className="mt-2 text-xs text-violet-400 italic">
                            ✨ Go ahead, try interacting with it!
                        </p>
                    )}
                </div>

                {/* Progress and navigation */}
                <div className="mt-5 flex items-center justify-between">
                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                        {TUTORIAL_STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                    ? "bg-violet-400"
                                    : index < currentStep
                                        ? "bg-violet-600"
                                        : "bg-zinc-700"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                className="h-8 px-3 text-zinc-400 hover:text-white hover:bg-white/10"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleNext}
                            className="h-8 px-4 bg-violet-600/80 hover:bg-violet-500 text-white border border-violet-500/30"
                        >
                            {currentStep === TUTORIAL_STEPS.length - 1 ? "Finish" : "Next"}
                            {currentStep < TUTORIAL_STEPS.length - 1 && (
                                <ChevronRight className="w-4 h-4 ml-1" />
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
    text: string;
    speed?: number;
    className?: string;
    cursor?: boolean;
}

export function TypewriterText({ text, speed = 20, className, cursor = true }: TypewriterTextProps) {
    const [displayed, setDisplayed] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let i = 0;
        setDisplayed("");
        setIsComplete(false);

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed((prev) => prev + text.charAt(i));
                i++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <span className={cn("inline-block", className)}>
            {displayed}
            {cursor && !isComplete && (
                <span className="animate-pulse font-bold text-primary ml-0.5">|</span>
            )}
        </span>
    );
}

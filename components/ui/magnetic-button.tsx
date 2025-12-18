"use client";

import React, { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function MagneticButton({ children, className, variant = "default", size = "default", ...props }: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `translate(${x * 0.2}px, ${y * 0.2}px)`,
                transition: "transform 0.1s ease-out",
            }}
            className={cn("inline-block transition-transform duration-75", className)}
        >
            <Button
                variant={variant}
                size={size}
                className="w-full h-full pointer-events-none" // Disable pointer events on button so the div handles hover
                {...props}
            >
                {children}
            </Button>
        </div>
    );
}

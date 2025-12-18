"use client";
import { cn } from "@/lib/utils";

interface MagneticBorderProps {
    className?: string;
}

export function MagneticBorder({ className }: MagneticBorderProps) {
    return (
        <div
            className={cn("absolute inset-0 pointer-events-none z-10 transition-opacity duration-500", className)}
            style={{
                background: `radial-gradient(var(--magnetic-radius, 600px) circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 40%) fixed`,
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                padding: '1px', // Border width - using 1px for refined outline
            }}
        />
    );
}

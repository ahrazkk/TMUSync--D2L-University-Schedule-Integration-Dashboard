"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function BackgroundGrid({ className, children }: { className?: string, children?: React.ReactNode }) {
    return (
        <div className={cn("relative w-full h-full min-h-screen overflow-hidden bg-background", className)}>
            <div className="absolute inset-0 w-full h-full bg-grid-black/[0.1] dark:bg-grid-white/[0.05] z-0 pointer-events-none">
                {/* Radial gradient for the container to give a faded look at the edges */}
                <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            </div>

            {/* Optional: Tracing Beam effect implementation can go here or be a separate component. 
          For now, just the grid foundation. */}

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

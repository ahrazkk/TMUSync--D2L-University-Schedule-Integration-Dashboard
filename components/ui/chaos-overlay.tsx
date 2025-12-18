"use client";

import React, { useEffect, useState } from "react";

export function ChaosOverlay() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            setIsHovering(true);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[60] pointer-events-none transition-opacity duration-700"
            style={{
                backdropFilter: "grayscale(100%) blur(3px) contrast(1.2)",
                WebkitBackdropFilter: "grayscale(100%) blur(3px) contrast(1.2)",
                maskImage: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, transparent 10%, black 100%)`,
                WebkitMaskImage: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, transparent 10%, black 100%)`,
            }}
        >
            {/* Chaos layer applies grayscale/blur effect outside the cursor spotlight */}
        </div>
    );
}

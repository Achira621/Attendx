"use client";

import React, { useEffect, useRef } from "react";

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
}

export function AmbientCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Brand color palette from official Attendex identity
    const palette = [
      "rgba(124, 58, 237, ", // Aurora Purple (#7C3AED)
      "rgba(255, 122, 89, ", // Sunset Coral (#FF7A59)
      "rgba(246, 215, 176, ", // Amber Sand (#F6D7B0)
      "rgba(14, 165, 233, ", // Cyan/Ice Blue
    ];

    // Initialize subtle floating presence nodes
    const nodeCount = Math.min(28, Math.floor((width * height) / 45000));
    const nodes: NodePoint[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const colorBase = palette[i % palette.length];
      const r = 2.5 + Math.random() * 3.5;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: r,
        baseRadius: r,
        color: colorBase,
        alpha: 0.2 + Math.random() * 0.35,
      });
    }

    // Interactive mouse coordinates
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);

    let step = 0;

    // Draw dynamic fluid presence canvas
    const render = () => {
      step += 0.007;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // 1. Draw atmospheric acoustic waves (sine interference ribbons)
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseHeight = height * (0.28 + w * 0.24);
        const amplitude = 32 + w * 18;
        const frequency = 0.0018 + w * 0.0006;
        const phase = step * (1.1 + w * 0.4);

        ctx.moveTo(0, baseHeight);
        for (let x = 0; x <= width; x += 16) {
          // Add subtle mouse elevation near cursor
          const distToMouse = Math.hypot(x - mouse.x, baseHeight - mouse.y);
          const mouseLift = distToMouse < mouse.radius ? (1 - distToMouse / mouse.radius) * 18 : 0;
          const y = baseHeight + Math.sin(x * frequency + phase) * amplitude - mouseLift;
          ctx.lineTo(x, y);
        }

        // Gradient stroke for acoustic wave
        const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
        if (isDark) {
          waveGrad.addColorStop(0, "rgba(124, 58, 237, 0.02)");
          waveGrad.addColorStop(0.35, "rgba(124, 58, 237, 0.16)");
          waveGrad.addColorStop(0.7, "rgba(255, 122, 89, 0.16)");
          waveGrad.addColorStop(1, "rgba(246, 215, 176, 0.03)");
        } else {
          waveGrad.addColorStop(0, "rgba(124, 58, 237, 0.03)");
          waveGrad.addColorStop(0.4, "rgba(124, 58, 237, 0.14)");
          waveGrad.addColorStop(0.75, "rgba(255, 122, 89, 0.14)");
          waveGrad.addColorStop(1, "rgba(231, 242, 255, 0.05)");
        }

        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // 2. Interconnect nearby presence nodes with delicate lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          const maxDist = 135;

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * (isDark ? 0.12 : 0.08);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(167, 139, 250, ${opacity})`
              : `rgba(124, 58, 237, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 3. Render and update floating presence particles
      for (const node of nodes) {
        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Bounce on edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Subtle mouse push
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 1.5;
          node.x += (dx / dist) * force;
          node.y += (dy / dist) * force;
        }

        // Draw node glow
        const glowRad = node.radius * 3.2;
        const glowGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRad);
        glowGrad.addColorStop(0, `${node.color}${node.alpha * (isDark ? 0.5 : 0.4)})`);
        glowGrad.addColorStop(1, `${node.color}0)`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRad, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Node center core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}${node.alpha * (isDark ? 0.9 : 0.8)})`;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Tab visibility handling to pause RAF and save battery
    let isVisible = true;
    const handleVisibility = () => {
      if (document.hidden) {
        isVisible = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isVisible = true;
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    if (isVisible) {
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}

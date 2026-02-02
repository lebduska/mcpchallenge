"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: "mcp",
    image: "/images/banners/banner-mcp.jpg",
    title: "MCP Challenge",
    subtitle: "Master your MCP skills",
    cta: { label: "Start Learning", href: "/learn" },
  },
  {
    id: "chess",
    image: "/images/banners/banner-chess.jpg",
    title: "Chess Challenge",
    subtitle: "Play chess against AI using MCP tools",
    cta: { label: "Play Chess", href: "/challenges/chess" },
  },
  {
    id: "mona-lisa",
    image: "/images/banners/banner-mona-lisa.jpg",
    title: "Canvas Challenge",
    subtitle: "Create art with AI through MCP",
    cta: { label: "Start Drawing", href: "/challenges/canvas-draw" },
  },
];

function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 210 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M105 10 L195 40 L195 100 C195 155 105 195 105 195 C105 195 15 155 15 100 L15 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <text
        x="105"
        y="112"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="52"
        fontWeight="700"
        fill="currentColor"
      >
        MCP
      </text>
    </svg>
  );
}

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Images */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {slide.id === "mcp" && (
          <div className="flex items-center gap-4 mb-4">
            <Logo className="text-white" />
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Challenge
            </h1>
          </div>
        )}
        {slide.id !== "mcp" && (
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            {slide.title}
          </h1>
        )}
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl">
          {slide.subtitle}
        </p>
        <Button asChild size="lg" className="text-lg px-8">
          <Link href={slide.cta.href}>{slide.cta.label}</Link>
        </Button>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

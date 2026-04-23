"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Environment, Sphere, Float } from "@react-three/drei";
import { useState, useRef, useMemo } from "react";
import * as THREE from "three";

// Function to generate random points inside a sphere for particles
function randomInSphere(count: number, radius: number) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    points[i * 3] = x;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = z;
  }
  return points;
}

function Star({ count = 2000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const sphere = useMemo(() => randomInSphere(count, 15), [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#d4af37" // gold
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FloatingArtifact() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={[0, 0, -2]}>
        {/* Icosahedron looking like a mystical core */}
        <icosahedronGeometry args={[2.5, 1]} />
        <meshStandardMaterial 
          color="#a0783a" 
          wireframe
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
      {/* Fallback dark background so text is readable */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "var(--paper-darker)" }} />
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <directionalLight position={[-5, -5, 5]} intensity={1} color="#c9a96e" />
        
        <Star />
        <FloatingArtifact />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

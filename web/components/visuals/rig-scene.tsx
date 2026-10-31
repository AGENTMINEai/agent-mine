"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const NEON = ["#4DE1FF", "#7C5CFF", "#FF4FD8", "#FFB454", "#54E6A4", "#FF7A45"];

/* ------------------------------------------------------------------ */
/* LED field: one draw call, per-point colour + random flicker phase.  */
/* ------------------------------------------------------------------ */

const ledVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    float slow = 0.55 + 0.45 * sin(uTime * 2.4 + aPhase * 6.2831);
    float fast = 0.85 + 0.15 * sin(uTime * 11.0 + aPhase * 19.7);
    float off = step(0.06, fract(sin(aPhase * 91.7) * 43758.5453));

    vColor = aColor * (0.45 + 0.55 * slow * fast) * mix(0.2, 1.0, off);
    gl_PointSize = 0.09 * (300.0 / -mv.z);
  }
`;

const ledFragment = /* glsl */ `
  varying vec3 vColor;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.15, r);
    gl_FragColor = vec4(vColor, a);
  }
`;

const PANELS_Y = [0.89, 0.3, -0.29, -0.88];

function LedField({ dense }: { dense: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, phases } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const ph: number[] = [];

    const push = (x: number, y: number, z: number) => {
      pos.push(x, y, z);
      const c = new THREE.Color(NEON[Math.floor(Math.random() * NEON.length)]);
      col.push(c.r, c.g, c.b);
      ph.push(Math.random() * 10);
    };

    const cols = dense ? 16 : 10;
    const rows = dense ? 9 : 6;
    for (const cy of PANELS_Y) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = -1.06 + (c / (cols - 1)) * 2.12;
          const y = cy + (r / (rows - 1) - 0.5) * 0.44;
          push(x + (Math.random() - 0.5) * 0.015, y, 0.575);
        }
      }
    }

    const sideRows = dense ? 8 : 5;
    for (let i = 0; i < sideRows; i++) {
      for (let j = 0; j < 3; j++) {
        const y = 0.75 - i * 0.2;
        const z = 0.36 - j * 0.3;
        push(-1.415, y, z);
        push(1.415, y, z);
      }
    }

    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
      phases: new Float32Array(ph),
    };
  }, [dense]);

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={ledVertex}
        fragmentShader={ledFragment}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Fibre optics: CatmullRom tubes with a travelling pulse in the UV.   */
/* ------------------------------------------------------------------ */

const fibreVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fibreFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  varying vec2 vUv;

  void main() {
    float head = fract(vUv.x - uTime * uSpeed);
    float pulse = smoothstep(0.0, 0.05, head) * (1.0 - smoothstep(0.05, 0.22, head));

    float head2 = fract(vUv.x - uTime * uSpeed + 0.5);
    float pulse2 = smoothstep(0.0, 0.04, head2) * (1.0 - smoothstep(0.04, 0.16, head2));

    float glow = 0.07 + pulse * 0.95 + pulse2 * 0.45;
    gl_FragColor = vec4(uColor * glow, min(1.0, glow));
  }
`;

function Fibre({
  points,
  color,
  speed,
}: {
  points: [number, number, number][];
  color: string;
  speed: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    return new THREE.TubeGeometry(curve, 96, 0.018, 5, false);
  }, [points]);

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={fibreVertex}
        fragmentShader={fibreFragment}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uSpeed: { value: speed },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function FibreBundle({ dense }: { dense: boolean }) {
  const fibres = useMemo(() => {
    const list: { points: [number, number, number][]; color: string; speed: number }[] = [];
    const count = dense ? 4 : 2;

    for (let i = 0; i < count; i++) {
      const y = 0.9 - i * 0.55;
      const color = NEON[i % NEON.length];

      list.push({
        points: [
          [-1.41, y, 0.45],
          [-2.1, y + 0.2, 0.3],
          [-2.9, y - 0.2, 0.7],
          [-3.7, y - 0.85, 0.1],
        ],
        color,
        speed: 0.15 + i * 0.04,
      });

      list.push({
        points: [
          [1.41, y - 0.15, 0.45],
          [2.1, y + 0.22, 0.25],
          [2.9, y - 0.1, 0.7],
          [3.7, y - 0.8, 0.15],
        ],
        color: NEON[(i + 2) % NEON.length],
        speed: 0.17 + i * 0.04,
      });
    }

    list.push({
      points: [
        [-1.1, 1.5, 0.1],
        [-0.45, 1.95, -0.2],
        [0.45, 1.98, -0.22],
        [1.1, 1.52, 0.08],
      ],
      color: "#4DE1FF",
      speed: 0.22,
    });
    list.push({
      points: [
        [-1.15, 1.4, -0.35],
        [-0.3, 1.82, -0.6],
        [0.5, 1.8, -0.58],
        [1.15, 1.38, -0.38],
      ],
      color: "#FF4FD8",
      speed: 0.19,
    });

    return list;
  }, [dense]);

  return (
    <>
      {fibres.map((f, i) => (
        <Fibre key={i} {...f} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cabinet                                                             */
/* ------------------------------------------------------------------ */

function Cabinet() {
  const group = useRef<THREE.Group>(null);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.82, 2.92, 1.12)), []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.16) * 0.11 + 0.05;
    group.current.position.y = Math.sin(t * 0.6) * 0.03;
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[2.8, 2.9, 1.1]} />
        <meshStandardMaterial color="#070b11" metalness={0.72} roughness={0.42} />
      </mesh>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#2E7C9A" transparent opacity={0.7} />
      </lineSegments>

      {/* backplate: lifts the LED contrast */}
      <mesh position={[0, 0, 0.552]}>
        <planeGeometry args={[2.32, 2.84]} />
        <meshStandardMaterial color="#040a11" emissive="#0B2230" emissiveIntensity={0.5} metalness={0.2} roughness={0.8} />
      </mesh>

      {[1.18, 0.59, 0, -0.59, -1.18].map((y, i) => (
        <mesh key={i} position={[0, y, 0.556]}>
          <boxGeometry args={[2.34, 0.03, 0.02]} />
          <meshBasicMaterial color={i % 2 ? "#173D50" : "#2A7691"} />
        </mesh>
      ))}

      {[-1.415, 1.415].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.02, 2.7, 0.9]} />
          <meshStandardMaterial color="#060a10" metalness={0.8} roughness={0.5} />
        </mesh>
      ))}

      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[0.55, 0.14, 0.5]} />
        <meshStandardMaterial color="#0b121a" metalness={0.7} roughness={0.45} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function Scene({ dense }: { dense: boolean }) {
  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight position={[-3.4, 2.2, 4.2]} intensity={5} color="#4DE1FF" distance={16} />
      <pointLight position={[3.4, 1.2, 3.6]} intensity={4} color="#FF4FD8" distance={16} />
      <pointLight position={[0, -3, 2.5]} intensity={2.5} color="#FFB454" distance={12} />

      <Cabinet />
      <LedField dense={dense} />
      <FibreBundle dense={dense} />

      {dense && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.0} luminanceThreshold={0.5} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

export function RigScene({ className, dense = true }: { className?: string; dense?: boolean }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        camera={{ position: [0, 0.35, 9.6], fov: 40 }}
      >
        <Scene dense={dense} />
      </Canvas>
    </div>
  );
}

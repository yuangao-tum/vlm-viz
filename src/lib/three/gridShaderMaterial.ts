'use client'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGridOpacity;
  uniform float uCameraDistance;

  varying vec3 vWorldPos;
  varying vec2 vUv;

  float gridLine(vec2 uv, float freq, float thickness) {
    vec2 grid = fract(uv * freq);
    vec2 dg = fwidth(uv * freq);
    vec2 line = smoothstep(dg * thickness, vec2(0.0), min(grid, 1.0 - grid));
    return max(line.x, line.y);
  }

  void main() {
    // Zoom-adaptive grid: denser when close, sparser when far
    float dist = uCameraDistance;
    float freq = mix(8.0, 2.0, clamp(dist / 50.0, 0.0, 1.0));
    float thickness = 1.5;

    float grid = gridLine(vUv, freq, thickness);

    vec3 surfaceColor = uColor * 0.35;
    vec3 lineColor = uColor;
    vec3 finalColor = mix(surfaceColor, lineColor, grid * uGridOpacity);

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`

export function createGridMaterial(color: string, opacity = 0.85, gridOpacity = 0.7) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uGridOpacity: { value: gridOpacity },
      uCameraDistance: { value: 20.0 },
    },
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: opacity > 0.95,
  })
}

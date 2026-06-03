'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * WebGL shader adapté au branding Evolya'Fit
 * Background : navy #0D1F3C — Lines : vert #4E9B6F avec légère aberration chromatique
 */
export function WebGLShader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene | null
    camera: THREE.OrthographicCamera | null
    renderer: THREE.WebGLRenderer | null
    mesh: THREE.Mesh | null
    uniforms: Record<string, { value: unknown }> | null
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const { current: refs } = sceneRef

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    // Shader adapté Evolya :
    // Background navy #0D1F3C (0.051, 0.122, 0.235)
    // Lignes vert #4E9B6F (0.306, 0.608, 0.435) avec aberration chromatique subtile
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        float d = length(p) * distortion;

        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);

        // Branding Evolya
        // Navy bg : #0D1F3C
        vec3 bg = vec3(0.051, 0.122, 0.235);

        // Lignes teintées vert #4E9B6F avec aberration chromatique
        vec3 line = vec3(
          r * 0.35 + g * 0.08,
          g * 0.82,
          b * 0.52 + r * 0.08
        );

        gl_FragColor = vec4(bg + line, 1.0);
      }
    `

    const initScene = () => {
      refs.scene = new THREE.Scene()
      refs.renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      refs.renderer.setClearColor(new THREE.Color(0x0d1f3c))

      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight

      refs.uniforms = {
        resolution: { value: [w, h] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.05 },
      }

      const positions = new THREE.BufferAttribute(
        new Float32Array([
          -1.0, -1.0, 0.0,
           1.0, -1.0, 0.0,
          -1.0,  1.0, 0.0,
           1.0, -1.0, 0.0,
          -1.0,  1.0, 0.0,
           1.0,  1.0, 0.0,
        ]),
        3
      )
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', positions)

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms as THREE.RawShaderMaterial['uniforms'],
        side: THREE.DoubleSide,
      })

      refs.mesh = new THREE.Mesh(geometry, material)
      refs.scene.add(refs.mesh)

      handleResize()
    }

    const animate = () => {
      if (refs.uniforms) {
        ;(refs.uniforms.time as { value: number }).value += 0.008
      }
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      refs.renderer.setSize(w, h, false)
      ;(refs.uniforms.resolution as { value: number[] }).value = [w, h]
    }

    initScene()
    animate()

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      ro.disconnect()
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }
      refs.renderer?.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  )
}

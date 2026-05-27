'use client'

import { useEffect, useRef } from 'react'

interface ShaderBackgroundProps {
  className?: string
}

export default function ShaderBackground({ className = '' }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `

  // Fragment shader — couleurs adaptées au branding Evolya
  // bgColor1 : navy foncé  #0D1F3C → vec4(0.051, 0.122, 0.235)
  // bgColor2 : navy légèrement éclairé → vec4(0.07, 0.17, 0.30)
  // lineColor : vert Evolya #4E9B6F → vec4(0.306, 0.608, 0.435)
  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const float overallSpeed    = 0.18;
    const float gridSmoothWidth = 0.015;
    const float axisWidth       = 0.05;
    const float majorLineWidth  = 0.025;
    const float minorLineWidth  = 0.0125;
    const float majorLineFreq   = 5.0;
    const float minorLineFreq   = 1.0;
    const float scale           = 5.0;

    // Evolya green
    const vec4 lineColor = vec4(0.306, 0.608, 0.435, 1.0);

    const float minLineWidth  = 0.008;
    const float maxLineWidth  = 0.13;
    const float lineSpeed     = 1.0  * overallSpeed;
    const float lineAmplitude = 1.0;
    const float lineFrequency = 0.2;
    const float warpSpeed     = 0.2  * overallSpeed;
    const float warpFrequency = 0.5;
    const float warpAmplitude = 1.0;
    const float offsetFreq    = 0.5;
    const float offsetSpeed   = 1.33 * overallSpeed;
    const float minOffsetSpread = 0.6;
    const float maxOffsetSpread = 2.0;
    const int   linesPerGroup = 14;

    #define drawCircle(pos, radius, coord) \
      smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))

    #define drawSmoothLine(pos, halfWidth, t) \
      smoothstep(halfWidth, 0.0, abs(pos - (t)))

    #define drawCrispLine(pos, halfWidth, t) \
      smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))

    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }

    float getPlasmaY(float x, float hFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * hFade * lineAmplitude + offset;
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv    = fragCoord / iResolution.xy;
      vec2 space = (fragCoord - iResolution.xy * 0.5) / iResolution.x * 2.0 * scale;

      float hFade = 1.0 - (cos(uv.x * 6.28318) * 0.5 + 0.5);
      float vFade = 1.0 - (cos(uv.y * 6.28318) * 0.5 + 0.5);

      space.y += random(space.x * warpFrequency + iTime * warpSpeed)       * warpAmplitude * (0.5 + hFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * hFade;

      vec4 lines = vec4(0.0);

      // Evolya dark navy backgrounds
      vec4 bgColor1 = vec4(0.051, 0.122, 0.235, 1.0);
      vec4 bgColor2 = vec4(0.07,  0.17,  0.30,  1.0);

      for (int l = 0; l < linesPerGroup; l++) {
        float nli         = float(l) / float(linesPerGroup);
        float offsetTime  = iTime * offsetSpeed;
        float offsetPos   = float(l) + space.x * offsetFreq;
        float rand        = random(offsetPos + offsetTime) * 0.5 + 0.5;
        float halfWidth   = mix(minLineWidth, maxLineWidth, rand * hFade) / 2.0;
        float offset      = random(offsetPos + offsetTime * (1.0 + nli)) * mix(minOffsetSpread, maxOffsetSpread, hFade);
        float linePos     = getPlasmaY(space.x, hFade, offset);
        float line        = drawSmoothLine(linePos, halfWidth, space.y) / 2.0
                          + drawCrispLine(linePos, halfWidth * 0.15, space.y);

        float cx = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2  cp = vec2(cx, getPlasmaY(cx, hFade, offset));
        float circle = drawCircle(cp, 0.01, space) * 4.0;

        line += circle;
        lines += line * lineColor * rand;
      }

      vec4 col = mix(bgColor1, bgColor2, uv.x);
      col     *= vFade;
      col.a    = 1.0;
      col     += lines;

      gl_FragColor = col;
    }
  `

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    // ── Compile shader ──
    function loadShader(type: number, source: string) {
      const shader = gl!.createShader(type)!
      gl!.shaderSource(shader, source)
      gl!.compileShader(shader)
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader error:', gl!.getShaderInfoLog(shader))
        gl!.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = loadShader(gl.VERTEX_SHADER, vsSource)
    const fs = loadShader(gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const vertexPos = gl.getAttribLocation(program, 'aVertexPosition')
    const uResolution = gl.getUniformLocation(program, 'iResolution')
    const uTime = gl.getUniformLocation(program, 'iTime')

    // ── Resize to parent container ──
    function resize() {
      const parent = canvas!.parentElement
      const w = parent ? parent.clientWidth  : window.innerWidth
      const h = parent ? parent.clientHeight : window.innerHeight
      canvas!.width  = w
      canvas!.height = h
      gl!.viewport(0, 0, w, h)
    }
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    resize()

    // ── Render loop ──
    const startTime = Date.now()
    let rafId: number
    function render() {
      const t = (Date.now() - startTime) / 1000
      gl!.clearColor(0, 0, 0, 1)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
      gl!.useProgram(program)
      gl!.uniform2f(uResolution, canvas!.width, canvas!.height)
      gl!.uniform1f(uTime, t)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer)
      gl!.vertexAttribPointer(vertexPos, 2, gl!.FLOAT, false, 0, 0)
      gl!.enableVertexAttribArray(vertexPos)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      rafId = requestAnimationFrame(render)
    }
    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  )
}

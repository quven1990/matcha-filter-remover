/**
 * WebGL2 matcha pipeline aimed at TikTok viral “Matcha / Wild Hearts Whisper” look:
 * Apply — light oily ripple + hard olive/gold metal LUT, ink edges, grain (competitor-matched)
 * Remove — gold/olive mono collapse, edge-emboss flatten, grain denoise, magenta-guarded restore
 */

export type ProcessMode = "remove" | "apply";

/** Bump when Apply/Remove shaders change so open sessions pick up new programs. */
export const PIPELINE_REV = 14;

export type ApplyParams = {
  strength: number;
  liquid: number;
  grain: number;
  time: number;
};

export type RemoveParams = {
  neutralize: number;
  denoise: number;
  detail: number;
  temporal: number;
  balance: [number, number, number];
  toneRange: [number, number];
  analysisMix: number;
};

export type AnalyzeResult = {
  neutralize: number;
  denoise: number;
  detail: number;
  balance: [number, number, number];
  toneRange: [number, number];
  analysisMix: number;
  greenCast: number;
  yellowCast: number;
  noise: number;
};

const VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const APPLY_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_strength;
uniform float u_liquid;
uniform float u_grain;
uniform float u_time;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float valueNoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float fbm(vec2 p){
  float a = 0.5;
  float v = 0.0;
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = p * 2.07 + vec2(17.3, 9.2);
    a *= 0.52;
  }
  return v;
}
vec3 sampleSrc(vec2 uv){
  return texture(u_tex, clamp(uv, vec2(0.002), vec2(0.998))).rgb;
}
float sampleLuma(vec2 uv){
  vec3 c = sampleSrc(uv);
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// Competitor-style Matcha: keep subject readable, hard olive/gold metal bake,
// ink edges + mild oily ripple (liquid slider still ramps warp if users want melt).
void main(){
  float strength = clamp(u_strength, 0.0, 1.0);
  float motion = clamp(u_liquid, 0.0, 1.0);
  float grainAmt = clamp(u_grain, 0.0, 1.0);
  float t = u_time * (0.12 + motion * 0.35);
  vec2 uv = v_uv;
  vec2 centered = uv * 2.0 - 1.0;

  float nA = fbm(centered * 2.2 + vec2(t * 0.14, -t * 0.11));
  float nB = fbm(centered.yx * 2.8 + vec2(-t * 0.12, t * 0.1) + nA * 0.6);
  float nHi = valueNoise(centered * 22.0 + vec2(t * 0.8, -t * 0.55));

  // Default: micro oily ripple. Strong liquify only when liquid is high.
  vec2 flow = vec2(nA - 0.5, nB - 0.5) * (0.7 + motion * 1.4);
  flow += vec2(nHi - 0.5, 0.5 - nHi) * (0.35 + motion * 0.65);
  flow += vec2(
    sin(centered.y * 9.0 + nA * 3.0 + t),
    cos(centered.x * 8.0 - nB * 2.5 - t * 0.85)
  ) * (0.2 + motion * 0.55);

  float amp = (0.002 + 0.014 * motion + 0.028 * motion * motion) * strength;
  vec2 warped = uv + flow * amp;

  vec2 refr = normalize(flow + 1e-4) * u_texel * (0.8 + motion * 5.0) * strength;
  vec3 src = sampleSrc(warped);
  vec3 srcR = sampleSrc(warped + vec2(-refr.y, refr.x) * 0.7);
  vec3 srcB = sampleSrc(warped - vec2(-refr.y, refr.x) * 0.5);
  vec3 base = mix(src, vec3(srcR.r, src.g, srcB.b), 0.28 * strength);

  // Sobel-ish edges for ink outlines (competitor look)
  float L = sampleLuma(warped);
  float Lx =
    sampleLuma(warped + vec2(u_texel.x, 0.0)) - sampleLuma(warped - vec2(u_texel.x, 0.0)) +
    0.5 * (sampleLuma(warped + u_texel) - sampleLuma(warped - u_texel));
  float Ly =
    sampleLuma(warped + vec2(0.0, u_texel.y)) - sampleLuma(warped - vec2(0.0, u_texel.y)) +
    0.5 * (sampleLuma(warped + vec2(u_texel.x, -u_texel.y)) - sampleLuma(warped + vec2(-u_texel.x, u_texel.y)));
  float edge = clamp(length(vec2(Lx, Ly)) * 4.2, 0.0, 1.0);
  float ink = smoothstep(0.12, 0.55, edge);

  // Emboss / metallic relief from luma slope
  float emboss = clamp(0.5 + Lx * 2.2 + Ly * 1.4, 0.0, 1.0);
  float ridge = smoothstep(0.55, 0.92, emboss) * (0.35 + strength * 0.65);
  float trough = (1.0 - smoothstep(0.2, 0.55, emboss)) * strength;

  float crush = pow(clamp(L, 0.0, 1.0), mix(1.08, 0.68, strength));
  crush = clamp(crush * mix(1.0, 1.18, strength) - trough * 0.08 + ridge * 0.06, 0.0, 1.0);

  // Hard posterize — competitor duotone steps
  float levels = mix(9.0, 4.5, strength);
  float poster = floor(crush * levels + 0.5) / levels;
  poster = mix(crush, poster, 0.7 + strength * 0.25);

  // Olive-black → moss → acid gold → chrome yellow (FOPOP-style matcha)
  vec3 shadow = vec3(0.015, 0.04, 0.01);
  vec3 deep = vec3(0.09, 0.16, 0.03);
  vec3 midtone = vec3(0.28, 0.42, 0.05);
  vec3 acid = vec3(0.58, 0.72, 0.08);
  vec3 gold = vec3(0.88, 0.9, 0.22);
  vec3 chrome = vec3(0.98, 0.97, 0.7);
  vec3 palette = mix(shadow, deep, smoothstep(0.0, 0.2, poster));
  palette = mix(palette, midtone, smoothstep(0.16, 0.42, poster));
  palette = mix(palette, acid, smoothstep(0.38, 0.64, poster));
  palette = mix(palette, gold, smoothstep(0.58, 0.82, poster));
  palette = mix(palette, chrome, smoothstep(0.78, 0.98, poster));

  palette = mix(palette, shadow * 0.35, ink * (0.55 + strength * 0.35));
  palette += ridge * (0.1 + strength * 0.16) * vec3(1.0, 0.96, 0.42);
  palette -= trough * 0.07 * vec3(0.12, 0.06, 0.02);

  // Near-full LUT bake — structure from warped luma only
  float gradeMix = 0.78 + strength * 0.2;
  vec3 result = mix(base * vec3(0.35, 0.7, 0.15), palette, gradeMix);

  float stipple = hash21(floor(gl_FragCoord.xy * mix(0.7, 1.5, grainAmt)) + floor(u_time * 16.0));
  float g1 = hash21(gl_FragCoord.xy + floor(u_time * 28.0)) - 0.5;
  result += (stipple - 0.5) * grainAmt * (0.08 + strength * 0.05) * vec3(0.95, 1.0, 0.5);
  result += g1 * grainAmt * 0.07;
  result += (nHi - 0.5) * motion * strength * 0.03 * vec3(0.9, 1.0, 0.35);

  outColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}`;

const REMOVE_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_tex;
uniform sampler2D u_prev;
uniform vec2 u_texel;
uniform float u_neutralize;
uniform float u_denoise;
uniform float u_detail;
uniform float u_temporal;
uniform float u_hasPrev;
uniform vec3 u_balance;
uniform vec2 u_toneRange;
uniform float u_analysisMix;

float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 sampleSrc(vec2 uv){
  return texture(u_tex, clamp(uv, vec2(0.002), vec2(0.998))).rgb;
}

float bilateralWeight(vec3 center, vec3 sampleColor, float denoise){
  float lumaDelta = abs(luma(center) - luma(sampleColor));
  float colorDelta = length(center - sampleColor);
  float lumaLimit = mix(0.045, 0.095, denoise);
  float colorLimit = mix(0.075, 0.16, denoise);
  return exp(
    -(lumaDelta * lumaDelta) / max(0.0001, 2.0 * lumaLimit * lumaLimit)
    -(colorDelta * colorDelta) / max(0.0001, 2.0 * colorLimit * colorLimit)
  );
}

vec3 edgeNeighborhood(vec2 uv, float radius, float denoise){
  vec2 t = u_texel * radius;
  vec3 center = sampleSrc(uv);
  vec3 sum = center * 3.0;
  float total = 3.0;
  vec2 offs[8];
  offs[0] = vec2(t.x, 0.0);
  offs[1] = vec2(-t.x, 0.0);
  offs[2] = vec2(0.0, t.y);
  offs[3] = vec2(0.0, -t.y);
  offs[4] = t;
  offs[5] = -t;
  offs[6] = vec2(t.x, -t.y);
  offs[7] = vec2(-t.x, t.y);
  for (int i = 0; i < 8; i++) {
    vec3 s = sampleSrc(uv + offs[i]);
    float w = bilateralWeight(center, s, denoise);
    sum += s * w;
    total += w;
  }
  return sum / max(total, 1e-4);
}

vec3 adaptiveBalance(vec3 color){
  float high = max(max(color.r, color.g), color.b);
  float low = min(min(color.r, color.g), color.b);
  float saturation = high > 0.001 ? (high - low) / high : 0.0;
  // Keep more balance on green/gold-heavy pixels (matcha veil is saturated)
  float greenDom = max(0.0, color.g - max(color.r, color.b));
  float goldDom = max(0.0, min(color.r, color.g) - color.b);
  float castBoost = max(smoothstep(0.02, 0.18, greenDom), smoothstep(0.06, 0.28, goldDom));
  float neutralWeight = mix(1.0, 0.45, smoothstep(0.12, 0.72, saturation));
  neutralWeight = mix(neutralWeight, 1.0, castBoost * 0.8);
  vec3 balanced = color * mix(vec3(1.0), u_balance, u_analysisMix * neutralWeight);
  vec3 remapped = (balanced - u_toneRange.x) / max(u_toneRange.y - u_toneRange.x, 0.25);
  return mix(balanced, remapped, u_analysisMix * 0.42);
}

vec3 neutralizeCast(vec3 color, float neutralize){
  // Ease-in so mid slider values bite harder on baked viral Matcha stills.
  float n = pow(clamp(neutralize, 0.0, 1.0), 0.78);
  float L0 = luma(color);
  float high0 = max(max(color.r, color.g), color.b);
  float low0 = min(min(color.r, color.g), color.b);
  float sat0 = high0 > 1e-4 ? (high0 - low0) / high0 : 0.0;

  // Gold / bronze liquid-metal (R≈G >> B) — FOPOP / viral Matcha duotone
  float gold = max(0.0, min(color.r, color.g) - color.b);
  float goldPair = 1.0 - smoothstep(0.03, 0.2, abs(color.r - color.g));
  gold *= mix(0.6, 1.0, goldPair) * smoothstep(0.06, 0.32, sat0);
  color.r -= gold * n * 0.62;
  color.g -= gold * n * 0.66;
  color.b += gold * n * 0.36;

  // Acid / neon chartreuse: G and often R elevated, B crushed
  float acid = max(0.0, color.g - color.b) * 0.85 + max(0.0, color.r - color.b) * 0.45;
  acid *= smoothstep(0.08, 0.48, color.g);
  color.g -= acid * n * 0.72;
  color.r -= acid * n * 0.34;
  color.b += acid * n * 0.2;

  // Primary green excess vs red+blue
  float greenExcess = max(color.g - (color.r + color.b) * 0.5, 0.0);
  color.g -= greenExcess * n * 1.05;
  color.r += greenExcess * n * 0.03;
  color.b += greenExcess * n * 0.04;

  // Olive / matcha yellow-green
  float olive = max(color.g - color.b, 0.0) * 0.78 + max(color.r - color.b, 0.0) * 0.36;
  color.g -= olive * n * 0.6;
  color.r -= olive * n * 0.28;
  color.b += olive * n * 0.16;

  // Global green channel pull toward mean of R/B
  float rb = (color.r + color.b) * 0.5;
  float veil = max(0.0, color.g - rb);
  color.g = mix(color.g, rb, veil * n * 0.72);

  float gDom = max(0.0, color.g - max(color.r, color.b));
  color.g -= gDom * n * 0.65;

  float shadow = 1.0 - smoothstep(0.04, 0.48, L0);
  float highlight = smoothstep(0.38, 0.92, L0);
  color.g -= max(0.0, color.g - color.r) * shadow * 0.48 * n;
  color.g -= max(0.0, color.g - color.b) * highlight * 0.3 * n;

  // Chrome / specular yellow crests + ink-edge gold highlights
  float chrome = max(0.0, (color.r + color.g) * 0.5 - color.b) * highlight;
  color.g -= chrome * n * 0.34;
  color.r -= chrome * n * 0.24;
  color.b += chrome * n * 0.14;

  // Yellow leftover — cool without dumping into magenta
  float yellowExcess = max((color.r + color.g) * 0.5 - color.b, 0.0);
  color.b += yellowExcess * n * 0.32;
  color.g -= yellowExcess * n * 0.16;
  color.r -= yellowExcess * n * 0.18;

  // Hard mono-cast collapse toward luma (kills leftover gold soup / duotone)
  float L = luma(color);
  float high1 = max(max(color.r, color.g), color.b);
  float low1 = min(min(color.r, color.g), color.b);
  float sat1 = high1 > 1e-4 ? (high1 - low1) / high1 : 0.0;
  float mono = smoothstep(0.12, 0.48, sat1) * n;
  color = mix(color, vec3(L), mono * 0.78);
  color.g -= max(0.0, color.g - L) * n * 0.36;

  // Gentle warm-neutral bias so faces don't go grey-cyan after desat
  float mid = smoothstep(0.12, 0.55, L) * (1.0 - smoothstep(0.7, 0.95, L));
  color.r += mid * n * 0.04;
  color.b += mid * n * 0.012;

  // Floor: keep G from falling far below cooler channels (blocks pink crash)
  float coolMin = min(color.r, color.b);
  color.g = max(color.g, mix(color.g, coolMin * 0.97, n * 0.72));

  return color;
}

void main(){
  float neutralize = clamp(u_neutralize, 0.0, 1.0);
  float denoise = clamp(u_denoise, 0.0, 1.0);
  float restore = clamp(u_detail, 0.0, 1.0);
  float temp = clamp(u_temporal, 0.0, 1.0) * u_hasPrev;
  vec2 uv = v_uv;

  vec3 center = sampleSrc(uv);
  // Bilateral + chaos: ink edges / grain / metal relief read as high local variance
  vec3 local = edgeNeighborhood(uv, 1.5 + denoise * 2.6, denoise);
  float chaos = clamp(length(center - local) * 2.15, 0.0, 1.0);
  float denoiseEff = clamp(denoise + chaos * 0.28 * neutralize, 0.0, 1.0);
  vec3 smoothed = mix(center, local, denoiseEff * 0.92);

  if (temp > 0.001) {
    vec3 previous = texture(u_prev, clamp(uv, vec2(0.002), vec2(0.998))).rgb;
    float lumaDelta = abs(luma(center) - luma(previous));
    float colorDelta = length(center - previous);
    float stillness = 1.0 - smoothstep(0.018, 0.115, lumaDelta + colorDelta * 0.42);
    float temporalMix = stillness * denoiseEff * 0.34 * temp;
    smoothed = mix(smoothed, previous, temporalMix);
  }

  // Dual-pass neutralize for hard duotone gold/olive bake
  vec3 pass1 = neutralizeCast(adaptiveBalance(smoothed), neutralize);
  vec3 corrected = neutralizeCast(pass1, neutralize * (0.4 + chaos * 0.18));
  vec3 broadSource = edgeNeighborhood(uv, 3.6 + denoiseEff * 2.2, min(1.0, denoiseEff + 0.3));
  vec3 broad = neutralizeCast(adaptiveBalance(broadSource), neutralize * 0.9);
  float edgeGuard = 1.0 - smoothstep(0.07, 0.32, length(corrected - broad));
  // Flatten ink emboss / metal ridges — competitor Apply draws hard outlines
  float flatten = chaos * neutralize * (0.38 + denoiseEff * 0.28);
  vec3 detail = mix(corrected, broad, flatten);
  detail += (corrected - broad) * restore * 0.22 * edgeGuard * (1.0 - flatten * 0.75);
  float contrast = 1.0 + restore * 0.035 - neutralize * 0.04 - flatten * 0.08;
  detail = (detail - 0.5) * contrast + 0.5;

  detail = mix(detail, pow(max(detail, 0.0), vec3(0.93)), neutralize * 0.18);
  float L1 = luma(detail);
  float L2 = luma(center);
  detail += (L2 - L1) * vec3(0.1) * neutralize;

  float magenta = max(0.0, (detail.r + detail.b) * 0.5 - detail.g);
  detail.g += magenta * 0.88;
  detail.r -= magenta * 0.32;
  detail.b -= magenta * 0.44;
  float purple = max(0.0, detail.b - detail.g) * max(0.0, detail.r - detail.g * 0.55);
  detail.b -= purple * 0.78;
  detail.r -= purple * 0.34;
  float redLead = max(0.0, detail.r - max(detail.g, detail.b));
  detail.r -= redLead * 0.36 * neutralize;
  detail.g += redLead * 0.16 * neutralize;

  float goldLeft = max(0.0, min(detail.r, detail.g) - detail.b);
  detail.r -= goldLeft * neutralize * 0.52;
  detail.g -= goldLeft * neutralize * 0.56;
  detail.b += goldLeft * neutralize * 0.3;

  // Stronger emboss flatten for ink edges + metal relief
  float emboss = luma(detail) - luma(broad);
  detail -= emboss * chaos * neutralize * 0.72;
  detail = mix(detail, broad, chaos * neutralize * 0.26);

  // Soft mono pull when still very casty after cleanup
  float Ld = luma(detail);
  float highD = max(max(detail.r, detail.g), detail.b);
  float lowD = min(min(detail.r, detail.g), detail.b);
  float satD = highD > 1e-4 ? (highD - lowD) / highD : 0.0;
  float stillCast = smoothstep(0.1, 0.36, satD) * neutralize;
  detail = mix(detail, vec3(Ld), stillCast * 0.4);
  detail.r += stillCast * 0.028;
  detail.b -= stillCast * 0.008;

  outColor = vec4(clamp(detail, 0.0, 1.0), 1.0);
}`;

const PASS_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_tex;
void main(){
  outColor = texture(u_tex, v_uv);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("shader alloc failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh) || "compile error";
    gl.deleteShader(sh);
    throw new Error(info);
  }
  return sh;
}

function makeProgram(gl: WebGL2RenderingContext, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  if (!p) throw new Error("program alloc failed");
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "link error");
  }
  return p;
}

function createTex(gl: WebGL2RenderingContext) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("texture failed");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

function clamp01(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function percentileFromHist(hist: Uint32Array, total: number, p: number) {
  const target = total * p;
  let acc = 0;
  for (let i = 0; i < hist.length; i++) {
    acc += hist[i];
    if (acc >= target) return i / 255;
  }
  return p;
}

export class MatchaGL {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  applyProg: WebGLProgram;
  removeProg: WebGLProgram;
  passProg: WebGLProgram;
  vao: WebGLVertexArrayObject;
  tex: WebGLTexture;
  prevTex: WebGLTexture;
  private hasPrev = false;
  private applyUniforms: Record<string, WebGLUniformLocation | null>;
  private removeUniforms: Record<string, WebGLUniformLocation | null>;
  private passUniforms: Record<string, WebGLUniformLocation | null>;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;
    this.canvas = canvas;
    this.applyProg = makeProgram(gl, APPLY_FRAG);
    this.removeProg = makeProgram(gl, REMOVE_FRAG);
    this.passProg = makeProgram(gl, PASS_FRAG);

    const buf = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!vao || !buf) throw new Error("vao/buffer failed");
    this.vao = vao;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.tex = createTex(gl);
    this.prevTex = createTex(gl);

    this.applyUniforms = {
      u_tex: gl.getUniformLocation(this.applyProg, "u_tex"),
      u_texel: gl.getUniformLocation(this.applyProg, "u_texel"),
      u_strength: gl.getUniformLocation(this.applyProg, "u_strength"),
      u_liquid: gl.getUniformLocation(this.applyProg, "u_liquid"),
      u_grain: gl.getUniformLocation(this.applyProg, "u_grain"),
      u_time: gl.getUniformLocation(this.applyProg, "u_time"),
    };
    this.removeUniforms = {
      u_tex: gl.getUniformLocation(this.removeProg, "u_tex"),
      u_prev: gl.getUniformLocation(this.removeProg, "u_prev"),
      u_texel: gl.getUniformLocation(this.removeProg, "u_texel"),
      u_neutralize: gl.getUniformLocation(this.removeProg, "u_neutralize"),
      u_denoise: gl.getUniformLocation(this.removeProg, "u_denoise"),
      u_detail: gl.getUniformLocation(this.removeProg, "u_detail"),
      u_temporal: gl.getUniformLocation(this.removeProg, "u_temporal"),
      u_hasPrev: gl.getUniformLocation(this.removeProg, "u_hasPrev"),
      u_balance: gl.getUniformLocation(this.removeProg, "u_balance"),
      u_toneRange: gl.getUniformLocation(this.removeProg, "u_toneRange"),
      u_analysisMix: gl.getUniformLocation(this.removeProg, "u_analysisMix"),
    };
    this.passUniforms = {
      u_tex: gl.getUniformLocation(this.passProg, "u_tex"),
    };
  }

  resetTemporal() {
    this.hasPrev = false;
  }

  upload(source: TexImageSource, w: number, h: number) {
    const { gl, canvas } = this;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      this.hasPrev = false;
    }
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  private snapshotPrev() {
    const { gl, canvas } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, canvas.width, canvas.height, 0);
    this.hasPrev = true;
  }

  renderApply(params: ApplyParams) {
    const { gl, canvas } = this;
    gl.useProgram(this.applyProg);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.applyUniforms.u_tex, 0);
    gl.uniform2f(this.applyUniforms.u_texel, 1 / Math.max(1, canvas.width), 1 / Math.max(1, canvas.height));
    gl.uniform1f(this.applyUniforms.u_strength, params.strength / 100);
    gl.uniform1f(this.applyUniforms.u_liquid, params.liquid / 100);
    gl.uniform1f(this.applyUniforms.u_grain, params.grain / 100);
    gl.uniform1f(this.applyUniforms.u_time, params.time);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  renderRemove(params: RemoveParams) {
    const { gl, canvas } = this;
    gl.useProgram(this.removeProg);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.removeUniforms.u_tex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex);
    gl.uniform1i(this.removeUniforms.u_prev, 1);
    gl.uniform2f(this.removeUniforms.u_texel, 1 / Math.max(1, canvas.width), 1 / Math.max(1, canvas.height));
    gl.uniform1f(this.removeUniforms.u_neutralize, params.neutralize / 100);
    gl.uniform1f(this.removeUniforms.u_denoise, params.denoise / 100);
    gl.uniform1f(this.removeUniforms.u_detail, params.detail / 100);
    gl.uniform1f(this.removeUniforms.u_temporal, params.temporal / 100);
    gl.uniform1f(this.removeUniforms.u_hasPrev, this.hasPrev ? 1 : 0);
    gl.uniform3f(this.removeUniforms.u_balance, params.balance[0], params.balance[1], params.balance[2]);
    gl.uniform2f(this.removeUniforms.u_toneRange, params.toneRange[0], params.toneRange[1]);
    gl.uniform1f(this.removeUniforms.u_analysisMix, params.analysisMix);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.snapshotPrev();
  }

  /** Draw uploaded texture with no grade (used for AI result preview). */
  renderPass() {
    const { gl } = this;
    gl.useProgram(this.passProg);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.passUniforms.u_tex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const { gl } = this;
    gl.deleteTexture(this.tex);
    gl.deleteTexture(this.prevTex);
    gl.deleteProgram(this.applyProg);
    gl.deleteProgram(this.removeProg);
    gl.deleteProgram(this.passProg);
    gl.deleteVertexArray(this.vao);
  }
}

/** Full-frame cast / tone analysis (competitor-class adaptive balance). */
export function analyzeFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): AnalyzeResult {
  // Downsample for speed while keeping coverage
  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const w = Math.max(8, Math.round(width * scale));
  const h = Math.max(8, Math.round(height * scale));
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d", { willReadFrequently: true });
  if (!tctx) {
    return {
      neutralize: 68,
      denoise: 48,
      detail: 44,
      balance: [1, 1, 1],
      toneRange: [0, 1],
      analysisMix: 0.55,
      greenCast: 0.1,
      yellowCast: 0.05,
      noise: 0.2,
    };
  }
  tctx.drawImage(ctx.canvas, 0, 0, w, h);
  const { data } = tctx.getImageData(0, 0, w, h);

  const hist = new Uint32Array(256);
  let n = 0;
  let weightSum = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let greenCastSum = 0;
  let yellowCastSum = 0;
  let noiseSum = 0;
  let noiseCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const L = r * 0.2126 + g * 0.7152 + b * 0.0722;
      hist[Math.min(255, Math.round(L * 255))] += 1;
      n += 1;

      const high = Math.max(r, g, b);
      const sat = high > 0.001 ? (high - Math.min(r, g, b)) / high : 0;
      // Include saturated greens — viral Matcha is often neon lime / acid olive
      const greenDom = Math.max(0, g - Math.max(r, b));
      const acidChartreuse = Math.max(0, g - b) * 0.7 + Math.max(0, r - b) * 0.25;
      const isMatchaHue =
        greenDom > 0.035 ||
        g > (r + b) * 0.5 + 0.025 ||
        (acidChartreuse > 0.12 && g > 0.2);
      if (L > 0.06 && L < 0.97 && (sat < 0.62 || isMatchaHue)) {
        const wgt = isMatchaHue ? 1.25 : 1 - sat * 0.5;
        rSum += r * wgt;
        gSum += g * wgt;
        bSum += b * wgt;
        greenCastSum += Math.max(g - (r + b) * 0.5, 0) * wgt;
        greenCastSum += greenDom * 0.9 * wgt;
        greenCastSum += Math.max(0, acidChartreuse - 0.08) * 0.55 * wgt;
        yellowCastSum += Math.max((r + g) * 0.5 - b, 0) * wgt;
        weightSum += wgt;
      }

      if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && (x + y) % 2 === 0) {
        const lumaAt = (idx: number) =>
          (data[idx] * 0.2126 + data[idx + 1] * 0.7152 + data[idx + 2] * 0.0722) / 255;
        const left = lumaAt(i - 4);
        const right = lumaAt(i + 4);
        const up = lumaAt(i - w * 4);
        const down = lumaAt(i + w * 4);
        if (Math.max(Math.abs(left - right), Math.abs(up - down)) < 0.055) {
          noiseSum += Math.abs(L - (left + right + up + down) * 0.25);
          noiseCount += 1;
        }
      }
    }
  }

  const low = clamp01(percentileFromHist(hist, n, 0.02), 0, 0.28);
  const high = clamp01(percentileFromHist(hist, n, 0.98), 0.55, 1);
  const coverage = n ? weightSum / n : 0;
  const rMean = weightSum ? rSum / weightSum : 1;
  const gMean = weightSum ? gSum / weightSum : 1;
  const bMean = weightSum ? bSum / weightSum : 1;
  const mean = (rMean + gMean + bMean) / 3;
  const rawBalance: [number, number, number] = [
    clamp01(mean / Math.max(0.03, rMean), 0.82, 1.18),
    clamp01(mean / Math.max(0.03, gMean), 0.78, 1.1),
    clamp01(mean / Math.max(0.03, bMean), 0.82, 1.16),
  ];
  const balLuma = rawBalance[0] * 0.2126 + rawBalance[1] * 0.7152 + rawBalance[2] * 0.0722;
  const greenCast = weightSum ? greenCastSum / weightSum : 0;
  const yellowCast = weightSum ? yellowCastSum / weightSum : 0;
  const noise = clamp01((noiseCount ? noiseSum / noiseCount : 0) * 14);
  // Bias cast score upward for acid green AND gold liquid-metal duotone (R≈G >> B)
  const goldCast = Math.max(0, Math.min(rMean, gMean) - bMean);
  const castScore = clamp01(
    greenCast * 7.8 +
      yellowCast * 3.9 +
      goldCast * 5.0 +
      Math.max(0, gMean - rMean) * 2.2 +
      Math.max(0, gMean - bMean) * 1.7 +
      Math.max(0, rMean - bMean) * 1.35,
  );
  const crush = clamp01(1 - (high - low) / 0.86);

  // Strong green veils should be handled by neutralizeCast, not extreme channel gains
  // (gain-based "correction" flips olive into magenta on skin).
  const castGuard = clamp01(greenCast * 5.5 + goldCast * 4.0);
  let analysisMix = clamp01(0.44 + Math.min(0.24, coverage * 1.2) + castScore * 0.14, 0.4, 0.8);
  analysisMix *= 1 - castGuard * 0.4;

  let balance: [number, number, number] = [
    clamp01(rawBalance[0] / balLuma, 0.85, 1.16),
    clamp01(rawBalance[1] / balLuma, 0.86, 1.08),
    clamp01(rawBalance[2] / balLuma, 0.85, 1.14),
  ];
  balance = [
    balance[0] * (1 - castGuard * 0.55) + 1 * castGuard * 0.55,
    balance[1] * (1 - castGuard * 0.35) + 1 * castGuard * 0.35,
    balance[2] * (1 - castGuard * 0.55) + 1 * castGuard * 0.55,
  ];

  // Auto: hard gold/olive duotone + ink emboss need strong cast kill + denoise;
  // keep detail modest so metal ridges don't reappear.
  const neutralize = Math.round(clamp01(0.58 + castScore * 0.38, 0.58, 0.96) * 100);
  const denoise = Math.round(clamp01(0.46 + noise * 0.48 + castScore * 0.28, 0.46, 0.92) * 100);
  const detail = Math.round(clamp01(0.2 + noise * 0.08 + crush * 0.05, 0.18, 0.42) * 100);

  return {
    neutralize,
    denoise,
    detail,
    balance,
    toneRange: high - low >= 0.3 ? [low, high] : [0, 1],
    analysisMix,
    greenCast,
    yellowCast,
    noise,
  };
}

/** Merge multi-frame samples (video) into one recommended control set. */
export function mergeAnalyzeResults(results: AnalyzeResult[]): AnalyzeResult {
  if (results.length === 0) {
    return {
      neutralize: 68,
      denoise: 48,
      detail: 52,
      balance: [1.02, 0.98, 1.03],
      toneRange: [0, 1],
      analysisMix: 0.48,
      greenCast: 0.12,
      yellowCast: 0.06,
      noise: 0.22,
    };
  }
  if (results.length === 1) return results[0];

  const n = results.length;
  const avg = (pick: (r: AnalyzeResult) => number) => results.reduce((sum, r) => sum + pick(r), 0) / n;
  // Stronger casts win — better to over-correct slightly than leave green frames
  const neutralize = Math.round(Math.max(...results.map((r) => r.neutralize)));
  const denoise = Math.round(Math.max(...results.map((r) => r.denoise)));
  const detail = Math.round(avg((r) => r.detail));
  const balance: [number, number, number] = [
    clamp01(avg((r) => r.balance[0]), 0.75, 1.35),
    clamp01(avg((r) => r.balance[1]), 0.7, 1.15),
    clamp01(avg((r) => r.balance[2]), 0.75, 1.4),
  ];
  const toneLow = Math.min(...results.map((r) => r.toneRange[0]));
  const toneHigh = Math.max(...results.map((r) => r.toneRange[1]));

  return {
    neutralize,
    denoise,
    detail,
    balance,
    toneRange: toneHigh - toneLow >= 0.3 ? [toneLow, toneHigh] : [0, 1],
    analysisMix: clamp01(avg((r) => r.analysisMix), 0.5, 0.98),
    greenCast: avg((r) => r.greenCast),
    yellowCast: avg((r) => r.yellowCast),
    noise: avg((r) => r.noise),
  };
}

export const MAX_IMAGE_MB = 20;
export const MAX_VIDEO_SECONDS = 30;

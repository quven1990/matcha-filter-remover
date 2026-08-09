/**
 * WebGL2 matcha pipeline aligned to matchafilter.app-class look:
 * Apply — animated liquid flow, dual-neighborhood paint, olive palette, temporal grain
 * Remove — adaptive balance, cast neutralize, bilateral denoise, edge-guarded restore, temporal stillness
 */

export type ProcessMode = "remove" | "apply";

/** Bump when Apply/Remove shaders change so open sessions pick up new programs. */
export const PIPELINE_REV = 4;

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
vec3 sampleSrc(vec2 uv){
  return texture(u_tex, clamp(uv, vec2(0.002), vec2(0.998))).rgb;
}
vec3 neighborhood(vec2 uv, float radius){
  vec2 t = u_texel * radius;
  vec3 sum = sampleSrc(uv) * 4.0;
  sum += sampleSrc(uv + vec2(t.x, 0.0));
  sum += sampleSrc(uv - vec2(t.x, 0.0));
  sum += sampleSrc(uv + vec2(0.0, t.y));
  sum += sampleSrc(uv - vec2(0.0, t.y));
  sum += sampleSrc(uv + t);
  sum += sampleSrc(uv - t);
  sum += sampleSrc(uv + vec2(t.x, -t.y));
  sum += sampleSrc(uv + vec2(-t.x, t.y));
  return sum / 12.0;
}

void main(){
  float strength = clamp(u_strength, 0.0, 1.0);
  float motion = clamp(u_liquid, 0.0, 1.0);
  float grainAmt = clamp(u_grain, 0.0, 1.0);
  float t = u_time * (0.45 + motion * 1.25);
  vec2 uv = v_uv;
  vec2 centered = uv * 2.0 - 1.0;

  float n1 = valueNoise(centered * 3.5 + vec2(t * 0.37, -t * 0.21));
  float n2 = valueNoise(centered.yx * 5.0 + vec2(-t * 0.29, t * 0.19));
  // finer secondary swirl for slightly richer motion than a single octave
  float n3 = valueNoise(centered * 8.0 + vec2(t * 0.55, t * 0.33));
  vec2 flow = vec2(
    sin(centered.y * 10.0 + t * 2.1 + n1 * 5.0),
    cos(centered.x * 8.0 - t * 1.6 + n2 * 4.5)
  );
  flow += vec2(n1 - 0.5, n2 - 0.5) * 2.4;
  flow += vec2(n3 - 0.5, 0.5 - n3) * 0.55;
  vec2 warped = uv + flow * (0.006 + 0.025 * motion) * strength;

  vec3 center = sampleSrc(warped);
  vec3 soft = neighborhood(warped, 1.2 + strength * 2.3);
  vec3 broad = neighborhood(warped + flow * u_texel * 2.0, 3.5);
  vec3 painted = mix(center, soft, 0.38 + strength * 0.34);
  painted = mix(painted, broad, strength * 0.20);

  // subtle chromatic fringing along flow (extra polish, kept light)
  float chr = (0.35 + motion * 0.9) * strength;
  vec3 fringe = vec3(
    sampleSrc(warped + u_texel * vec2(chr, -chr * 0.2)).r,
    painted.g,
    sampleSrc(warped - u_texel * vec2(chr, chr * 0.15)).b
  );
  painted = mix(painted, fringe, 0.18 * strength);

  float luma = dot(painted, vec3(0.299, 0.587, 0.114));
  float edge = length(center - broad);
  float levels = mix(8.0, 4.0, strength);
  float poster = floor(luma * levels + 0.5) / levels;

  vec3 shadow = vec3(0.07, 0.095, 0.035);
  vec3 midtone = vec3(0.37, 0.47, 0.12);
  vec3 highlight = vec3(0.83, 0.79, 0.30);
  vec3 palette = mix(shadow, midtone, smoothstep(0.08, 0.62, poster));
  palette = mix(palette, highlight, smoothstep(0.58, 0.96, poster));
  palette += vec3(painted.r * 0.12, painted.g * 0.08, painted.b * 0.03);

  vec3 result = mix(painted, palette, 0.44 + strength * 0.50);
  result -= edge * (0.48 + strength * 0.70);
  float grain = hash21(gl_FragCoord.xy + floor(u_time * 28.0)) - 0.5;
  float grain2 = hash21(gl_FragCoord.xy * 1.37 + floor(u_time * 17.0)) - 0.5;
  result += grain * grainAmt * 0.13;
  result += grain2 * grainAmt * 0.045 * vec3(0.95, 1.0, 0.75);

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
  // Keep more balance on green-heavy pixels (matcha veil is saturated)
  float greenDom = max(0.0, color.g - max(color.r, color.b));
  float greenBoost = smoothstep(0.02, 0.18, greenDom);
  float neutralWeight = mix(1.0, 0.45, smoothstep(0.12, 0.72, saturation));
  neutralWeight = mix(neutralWeight, 1.0, greenBoost * 0.75);
  vec3 balanced = color * mix(vec3(1.0), u_balance, u_analysisMix * neutralWeight);
  vec3 remapped = (balanced - u_toneRange.x) / max(u_toneRange.y - u_toneRange.x, 0.25);
  return mix(balanced, remapped, u_analysisMix * 0.38);
}

vec3 neutralizeCast(vec3 color, float neutralize){
  // Mid slider values feel stronger (ease curve) — keep softer than before so
  // heavy olive veils don't collapse into magenta.
  float n = pow(clamp(neutralize, 0.0, 1.0), 0.88);
  float L0 = luma(color);

  // Primary green excess vs red+blue — pull G down; almost no R/B refill
  float greenExcess = max(color.g - (color.r + color.b) * 0.5, 0.0);
  color.g -= greenExcess * n * 0.88;
  color.r += greenExcess * n * 0.035;
  color.b += greenExcess * n * 0.025;

  // Olive / matcha yellow-green (R and G both high vs B)
  float olive = max(color.g - color.b, 0.0) * 0.65 + max(color.r - color.b, 0.0) * 0.22;
  color.g -= olive * n * 0.42;
  color.r -= olive * n * 0.16;
  color.b += olive * n * 0.08;

  // Global green channel pull toward mean of R/B (veil remover)
  float rb = (color.r + color.b) * 0.5;
  float veil = max(0.0, color.g - rb);
  color.g = mix(color.g, rb, veil * n * 0.52);

  // Also pull when green merely dominates (dark teal / murky green footage)
  float gDom = max(0.0, color.g - max(color.r, color.b));
  color.g -= gDom * n * 0.48;

  // Shadow green cleanup (TikTok heavy veils crush into shadows)
  float shadow = 1.0 - smoothstep(0.05, 0.5, L0);
  float highlight = smoothstep(0.5, 0.92, L0);
  color.g -= max(0.0, color.g - color.r) * shadow * 0.32 * n;
  color.g -= max(0.0, color.g - color.b) * highlight * 0.14 * n;

  // Yellow cast leftover — prefer cooling R/G over dumping blue (blue → magenta)
  float yellowExcess = max((color.r + color.g) * 0.5 - color.b, 0.0);
  color.b += yellowExcess * n * 0.16;
  color.g -= yellowExcess * n * 0.07;
  color.r -= yellowExcess * n * 0.08;

  // Desat remaining green hue toward luma (no R/B refill)
  float L = luma(color);
  float gPull = max(0.0, color.g - L);
  color.g -= gPull * n * 0.3;

  // Floor: keep G from falling far below the cooler channels (blocks pink crash)
  float coolMin = min(color.r, color.b);
  color.g = max(color.g, mix(color.g, coolMin * 0.96, n * 0.7));

  return color;
}

void main(){
  float neutralize = clamp(u_neutralize, 0.0, 1.0);
  float denoise = clamp(u_denoise, 0.0, 1.0);
  float restore = clamp(u_detail, 0.0, 1.0);
  float temp = clamp(u_temporal, 0.0, 1.0) * u_hasPrev;
  vec2 uv = v_uv;

  vec3 center = sampleSrc(uv);
  vec3 local = edgeNeighborhood(uv, 1.05 + denoise * 1.9, denoise);
  vec3 smoothed = mix(center, local, denoise * 0.78);

  if (temp > 0.001) {
    vec3 previous = texture(u_prev, clamp(uv, vec2(0.002), vec2(0.998))).rgb;
    float lumaDelta = abs(luma(center) - luma(previous));
    float colorDelta = length(center - previous);
    float stillness = 1.0 - smoothstep(0.018, 0.115, lumaDelta + colorDelta * 0.42);
    float temporalMix = stillness * denoise * 0.30 * temp;
    smoothed = mix(smoothed, previous, temporalMix);
  }

  // Dual-pass neutralize — second pass stays light to avoid magenta overshoot
  vec3 pass1 = neutralizeCast(adaptiveBalance(smoothed), neutralize);
  vec3 corrected = neutralizeCast(pass1, neutralize * 0.22);
  vec3 broadSource = edgeNeighborhood(uv, 2.8 + denoise * 1.4, min(1.0, denoise + 0.18));
  vec3 broad = neutralizeCast(adaptiveBalance(broadSource), neutralize * 0.7);
  float edgeGuard = 1.0 - smoothstep(0.11, 0.34, length(corrected - broad));
  vec3 detail = corrected + (corrected - broad) * restore * 0.48 * edgeGuard;
  float contrast = 1.0 + restore * 0.08 + neutralize * 0.035;
  detail = (detail - 0.5) * contrast + 0.5;

  // Lift crushed midtones that matcha grade often flattens — keep it gentle so
  // remove doesn't turn into a purple-black crush.
  detail = mix(detail, pow(max(detail, 0.0), vec3(0.94)), neutralize * 0.12);

  // recover some lift lost when pulling green out of dark frames
  float L1 = luma(detail);
  float L2 = luma(center);
  detail += (L2 - L1) * vec3(0.18) * neutralize;

  // Strong magenta/purple repair toward warm-neutral (not pink)
  float magenta = max(0.0, (detail.r + detail.b) * 0.5 - detail.g);
  detail.g += magenta * 0.78;
  detail.r -= magenta * 0.3;
  detail.b -= magenta * 0.42;
  float purple = max(0.0, detail.b - detail.g) * max(0.0, detail.r - detail.g * 0.55);
  detail.b -= purple * 0.75;
  detail.r -= purple * 0.32;
  float redLead = max(0.0, detail.r - max(detail.g, detail.b));
  detail.r -= redLead * 0.28 * neutralize;
  detail.g += redLead * 0.14 * neutralize;

  outColor = vec4(clamp(detail, 0.0, 1.0), 1.0);
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
  vao: WebGLVertexArrayObject;
  tex: WebGLTexture;
  prevTex: WebGLTexture;
  private hasPrev = false;
  private applyUniforms: Record<string, WebGLUniformLocation | null>;
  private removeUniforms: Record<string, WebGLUniformLocation | null>;

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

  dispose() {
    const { gl } = this;
    gl.deleteTexture(this.tex);
    gl.deleteTexture(this.prevTex);
    gl.deleteProgram(this.applyProg);
    gl.deleteProgram(this.removeProg);
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
      // Include saturated greens — matcha filter is often high-sat olive/green
      const greenDom = Math.max(0, g - Math.max(r, b));
      const isMatchaHue = greenDom > 0.04 || g > (r + b) * 0.5 + 0.03;
      if (L > 0.08 && L < 0.95 && (sat < 0.55 || isMatchaHue)) {
        const wgt = isMatchaHue ? 1.15 : 1 - sat * 0.55;
        rSum += r * wgt;
        gSum += g * wgt;
        bSum += b * wgt;
        greenCastSum += Math.max(g - (r + b) * 0.5, 0) * wgt;
        greenCastSum += greenDom * 0.85 * wgt;
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
  // Bias cast score upward so heavy matcha veils auto-pick stronger neutralize
  const castScore = clamp01(greenCast * 7.2 + yellowCast * 2.4 + Math.max(0, gMean - rMean) * 2.8);
  const crush = clamp01(1 - (high - low) / 0.86);

  // Strong green veils should be handled by neutralizeCast, not extreme channel gains
  // (gain-based "correction" flips olive into magenta on skin).
  const castGuard = clamp01(greenCast * 5.5);
  let analysisMix = clamp01(0.4 + Math.min(0.22, coverage * 1.2) + castScore * 0.1, 0.35, 0.72);
  analysisMix *= 1 - castGuard * 0.45;

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

  // Cap auto strength — aggressive neutralize + blue boost was flipping green to magenta
  const neutralize = Math.round(clamp01(0.42 + castScore * 0.22, 0.4, 0.62) * 100);
  const denoise = Math.round(clamp01(0.28 + noise * 0.5 + castScore * 0.12, 0.28, 0.72) * 100);
  const detail = Math.round(clamp01(0.34 + noise * 0.16 + crush * 0.12, 0.32, 0.62) * 100);

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

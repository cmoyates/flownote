import { useWindowDimensions } from "react-native";
import {
  Skia,
  Canvas,
  Shader,
  Fill,
  SkRuntimeEffect,
} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useSharedValue,
  SharedValue,
  useFrameCallback,
} from "react-native-reanimated";

const source = Skia.RuntimeEffect.Make(`
// --- Start of Updated Shader Code ---

// Uniforms
uniform vec4 u_bg_color;
uniform float u_dot_size;
uniform float u_spacing;
uniform float u_time;
uniform float u_noise_scale;
uniform float u_shape_mix;
uniform vec4 u_color;
uniform float u_max_brightness; // <-- The new uniform

// --- SDF Functions (unchanged) ---
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

// --- 3D Simplex Noise (snoise) (unchanged) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0)); vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m; return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec4 main(vec2 pos) {
  // --- Setup ---
  float dot_size = u_dot_size > 0.0 ? u_dot_size : 8.0;
  float spacing = u_spacing >= 0.0 ? u_spacing : 4.0;
  float noise_scale = u_noise_scale > 0.0 ? u_noise_scale : 0.01;
  // Use the new uniform, with a default of 1.0 if not provided or negative.
  float max_brightness = u_max_brightness > 0.0 ? u_max_brightness : 1.0;
  float pitch = dot_size + spacing;

  vec2 center = floor(pos / pitch) * pitch + vec2(pitch / 2.0);
  vec3 noise_coord = vec3(center * noise_scale, u_time);

  // --- Brightness Calculation ---
  // 1. Get noise value from -1.0 to 1.0
  float noise = snoise(noise_coord);
  // 2. Normalize it to a 0.0 to 1.0 range
  float normalized_brightness = (noise + 1.0) / 2.0;
  // 3. Scale it by the max_brightness uniform
  float brightness = normalized_brightness * max_brightness;

  // --- Size and Shape Calculation ---
  vec2 p = pos - center;
  float half_size = brightness * dot_size / 2.0;

  float dist_circle = sdCircle(p, half_size);
  float dist_square = sdBox(p, vec2(half_size));
  float dist = mix(dist_circle, dist_square, u_shape_mix);

  // --- Final Color Drawing ---
  vec4 dot_color = vec4(brightness * u_color.rgb, 1.0);
  float alpha = 1.0 - smoothstep(-1.0, 1.0, dist);
  return mix(u_bg_color, dot_color, alpha);
}
`);

interface DotMatrixProps {
  speed: SharedValue<number>;
  maxBrightness: SharedValue<number>;
  paused: SharedValue<boolean>;
}

const DOT_SIZE = 10.0;
const SPACING = 0.0;
const COLOR: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0];
const BACKGROUND_COLOR: [number, number, number, number] = [0.0, 0.0, 0.0, 1.0];
const SPEED = 0.0005;
const NOISE_SCALE = 0.006;
const SHAPE_MIX = 0.0;
const MAX_BRIGHTNESS = 1.0;

export const useFlickerFreeClock = (
  speed: SharedValue<number>,
  isPaused: SharedValue<boolean>
) => {
  const integratedTime = useSharedValue(0);
  const lastTimestamp = useSharedValue(0);

  useFrameCallback((frameInfo) => {
    if (isPaused.value) {
      // When paused, update the last timestamp to prevent a time jump on resume
      lastTimestamp.value = frameInfo.timestamp;
      return;
    }

    if (lastTimestamp.value === 0) {
      lastTimestamp.value = frameInfo.timestamp;
    }

    // Calculate time passed since the last frame
    const delta = frameInfo.timestamp - lastTimestamp.value;

    // Add the scaled delta to our integrated time. This is the key step.
    // The increment is small and continuous, even if `speed.value` changes.
    integratedTime.value += delta * speed.value;

    // Update the last timestamp for the next frame
    lastTimestamp.value = frameInfo.timestamp;
  });

  return integratedTime;
};

export const DotMatrix = ({ speed, maxBrightness, paused }: DotMatrixProps) => {
  const { width, height } = useWindowDimensions();
  const clock = useFlickerFreeClock(speed, paused);

  const uniforms = useDerivedValue(() => ({
    u_dot_size: DOT_SIZE,
    u_spacing: SPACING,
    u_color: COLOR,
    u_bg_color: BACKGROUND_COLOR,
    u_time: clock.value,
    u_noise_scale: NOISE_SCALE,
    u_shape_mix: SHAPE_MIX,
    u_max_brightness: maxBrightness.value,
  }));

  return (
    <Canvas style={{ width: "100%", height: "100%" }}>
      <Fill>
        <Shader source={source as SkRuntimeEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
};

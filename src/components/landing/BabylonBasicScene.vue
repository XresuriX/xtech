<script setup lang="ts">
/**
 * BabylonJS Basic Scene Component
 *
 * A basic 3D scene with an animated spinning box, audio playback,
 * and FPS controls.
 *
 * @component
 * @example
 * <BabylonBasicScene />
 *
 * @accessibility
 * - Full keyboard navigation for FPS controls
 * - Screen reader announcements for scene state
 * - ARIA labels on all interactive controls
 *
 * @features
 * - Animated spinning box with adjustable speed
 * - Audio playback with play/pause
 * - FPS control slider (1-60 FPS)
 * - Mouse and touch camera controls
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as BABYLON from 'babylonjs';

interface Props {
  /** Initial FPS for animation */
  initialFps?: number;
}

interface Emits {
  /** Scene loaded event */
  (e: 'sceneReady', engine: BABYLON.Engine): void;
  /** FPS changed event */
  (e: 'fpsChange', fps: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialFps: 30,
});

const emit = defineEmits<Emits>();

/** Canvas reference */
const canvasRef = ref<HTMLCanvasElement | null>(null);

/** Babylon engine */
const engine = ref<BABYLON.Engine | null>(null);

/** Babylon scene */
const scene = ref<BABYLON.Scene | null>(null);

/** Animation box mesh */
const box = ref<BABYLON.Mesh | null>(null);

/** Audio element */
const audioRef = ref<HTMLAudioElement | null>(null);

/** Audio playing state */
const isAudioPlaying = ref(false);

/** Current FPS setting */
const currentFps = ref(props.initialFps);

/** Is scene ready */
const isReady = ref(false);

/** Animation state */
const isAnimating = ref(true);

/**
 * Initialize the BabylonJS scene
 */
const initScene = () => {
  if (!canvasRef.value) return;

  // Create engine
  engine.value = new BABYLON.Engine(canvasRef.value, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  // Create scene
  scene.value = new BABYLON.Scene(engine.value);
  scene.value.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);

  // Create camera
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    Math.PI / 2,
    Math.PI / 2.5,
    5,
    BABYLON.Vector3.Zero(),
    scene.value
  );
  camera.attachControl(canvasRef.value, true);
  camera.wheelPrecision = 50;
  camera.minZ = 0.1;

  // Create lights
  const hemisphericLight = new BABYLON.HemisphericLight(
    'hemisphericLight',
    new BABYLON.Vector3(0, 1, 0),
    scene.value
  );
  hemisphericLight.intensity = 0.7;
  hemisphericLight.diffuse = new BABYLON.Color3(1, 0.95, 0.9);

  const directionalLight = new BABYLON.DirectionalLight(
    'directionalLight',
    new BABYLON.Vector3(-1, -2, -1),
    scene.value
  );
  directionalLight.intensity = 0.5;
  directionalLight.diffuse = new BABYLON.Color3(0.9, 0.85, 0.7);

  // Create ground
  const ground = BABYLON.MeshBuilder.CreateGround('ground', {
    width: 6,
    height: 6,
  }, scene.value);
  const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene.value);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
  groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  ground.material = groundMaterial;

  // Create animated box
  box.value = BABYLON.MeshBuilder.CreateBox('box', { size: 1 }, scene.value);
  box.value.position.y = 0.5;

  // Create box material with Ardenne colors (blue/gold)
  const boxMaterial = new BABYLON.StandardMaterial('boxMaterial', scene.value);
  boxMaterial.diffuseColor = new BABYLON.Color3(0.118, 0.227, 0.541); // #1e3a8a blue
  boxMaterial.specularColor = new BABYLON.Color3(0.96, 0.62, 0.04); // #f59e0b gold
  boxMaterial.specularPower = 32;
  boxMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.1);
  box.value.material = boxMaterial;

  // Add edges rendering for better visibility
  box.value.enableEdgesRendering();
  box.value.edgesWidth = 2;
  box.value.edgesColor = new BABYLON.Color4(0.96, 0.62, 0.04, 1);

  // Create animation
  const rotationAnimation = new BABYLON.Animation(
    'boxRotation',
    'rotation.y',
    currentFps.value,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );

  const keyFrames = [];
  keyFrames.push({ frame: 0, value: 0 });
  keyFrames.push({ frame: currentFps.value * 2, value: Math.PI * 2 });

  rotationAnimation.setKeys(keyFrames);

  // Easing function for smooth animation
  const easingFunction = new BABYLON.CubicEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  rotationAnimation.setEasingFunction(easingFunction);

  box.value.animations.push(rotationAnimation);

  // Start animation
  scene.value.beginAnimation(box.value, 0, currentFps.value * 2, true);

  // Render loop
  engine.value.runRenderLoop(() => {
    scene.value?.render();
  });

  isReady.value = true;
  emit('sceneReady', engine.value);
};

/**
 * Update animation FPS
 * @param newFps - New FPS value
 */
const updateFps = (newFps: number) => {
  currentFps.value = newFps;
  emit('fpsChange', newFps);

  if (scene.value && box.value && engine.value) {
    // Stop current animation
    scene.value.stopAnimation(box.value);

    // Create new animation with new FPS
    const rotationAnimation = new BABYLON.Animation(
      'boxRotation',
      'rotation.y',
      newFps,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keyFrames = [];
    keyFrames.push({ frame: 0, value: 0 });
    keyFrames.push({ frame: newFps * 2, value: Math.PI * 2 });

    rotationAnimation.setKeys(keyFrames);

    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    rotationAnimation.setEasingFunction(easingFunction);

    box.value.animations = [rotationAnimation];

    if (isAnimating.value) {
      scene.value.beginAnimation(box.value, 0, newFps * 2, true);
    }
  }
};

/**
 * Toggle animation play/pause
 */
const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value;

  if (scene.value && box.value) {
    if (isAnimating.value) {
      scene.value.beginAnimation(box.value, 0, currentFps.value * 2, true);
    } else {
      scene.value.stopAnimation(box.value);
    }
  }
};

/**
 * Toggle audio playback
 */
const toggleAudio = () => {
  if (!audioRef.value) return;

  if (isAudioPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
  isAudioPlaying.value = !isAudioPlaying.value;
};

/**
 * Handle window resize
 */
const handleResize = () => {
  engine.value?.resize();
};

// Lifecycle
onMounted(() => {
  initScene();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  engine.value?.dispose();
});

// Watch for FPS changes
watch(currentFps, (newFps) => {
  updateFps(newFps);
});
</script>

<template>
  <div
    class="babylon-scene"
    role="region"
    aria-label="BabylonJS 3D scene with animated box"
  >
    <!-- 3D Canvas -->
    <canvas
      ref="canvasRef"
      class="scene-canvas"
      role="img"
      aria-label="3D scene with spinning blue and gold box"
    />

    <!-- Audio Element (Hidden) -->
    <audio
      ref="audioRef"
      src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      loop
      preload="auto"
    />

    <!-- Controls Panel -->
    <div class="controls-panel" role="region" aria-label="Scene controls">
      <!-- Animation Controls -->
      <div class="control-group">
        <q-btn
          :icon="isAnimating ? 'pause' : 'play_arrow'"
          :label="isAnimating ? 'Pause' : 'Play'"
          :color="isAnimating ? 'warning' : 'positive'"
          size="sm"
          @click="toggleAnimation"
          :aria-label="isAnimating ? 'Pause box animation' : 'Play box animation'"
        />
      </div>

      <!-- FPS Slider -->
      <div class="control-group fps-control">
        <label for="fps-slider" class="control-label">
          Animation Speed: {{ currentFps }} FPS
        </label>
        <q-slider
          id="fps-slider"
          v-model="currentFps"
          :min="1"
          :max="60"
          :step="1"
          color="primary"
          aria-label="Animation speed in frames per second"
          @update:model-value="updateFps"
        />
        <div class="fps-labels">
          <span class="text-caption">Slow</span>
          <span class="text-caption">Fast</span>
        </div>
      </div>

      <!-- Audio Controls -->
      <div class="control-group">
        <q-btn
          :icon="isAudioPlaying ? 'volume_up' : 'volume_off'"
          :label="isAudioPlaying ? 'Stop Music' : 'Play Music'"
          :color="isAudioPlaying ? 'secondary' : 'grey-7'"
          size="sm"
          @click="toggleAudio"
          :aria-label="isAudioPlaying ? 'Stop background music' : 'Play background music'"
        />
      </div>
    </div>

    <!-- Status Announcements (Screen Reader Only) -->
    <div
      class="visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ isReady ? '3D scene ready. Box is ' + (isAnimating ? 'spinning' : 'paused') + ' at ' + currentFps + ' frames per second.' : 'Loading 3D scene...' }}
      {{ isAudioPlaying ? 'Background music playing.' : '' }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.babylon-scene {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;
}

.scene-canvas {
  width: 100%;
  height: 400px;
  display: block;
  outline: none;

  &:focus {
    outline: 2px solid #1e3a8a;
    outline-offset: -2px;
  }
}

.controls-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fps-control {
  flex: 1;
  min-width: 200px;
}

.control-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: 4px;
}

.fps-labels {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.5);
}

/**
 * Visually hidden for screen readers
 */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/**
 * Responsive
 */
@media (max-width: 599px) {
  .scene-canvas {
    height: 300px;
  }

  .controls-panel {
    flex-direction: column;
  }

  .fps-control {
    min-width: 100%;
  }
}
</style>
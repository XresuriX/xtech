<script setup lang="ts">
/**
 * BabylonJS Page
 *
 * Interactive 3D demos using Babylon.js engine.
 * Displays various 3D scene demonstrations.
 *
 * @page
 * @accessibility
 * - Scene containers have proper ARIA labels
 * - Provides fallback content for screen readers
 * - Descriptive button labels
 *
 * @responsive
 * - Responsive canvas sizing
 * - Mobile-friendly controls
 */

import { ref, computed } from 'vue';
import { useMeta } from 'quasar';
import BabylonBasicScene from '@/components/landing/BabylonBasicScene.vue';

useMeta({
  title: 'BabylonJS Demos - XTech',
  meta: {
    description: 'Experience interactive 3D scenes powered by Babylon.js',
  },
});

/**
 * Scene interface
 */
interface Scene {
  id: string;
  title: string;
  description: string;
  status: 'ready' | 'coming-soon' | 'experimental';
  thumbnail?: string;
}

/**
 * Available scenes
 */
const scenes = ref<Scene[]>([
  {
    id: 'basic',
    title: 'Basic Scene',
    description: 'A simple 3D scene with an animated spinning box, adjustable FPS, and background music.',
    status: 'ready',
  },
  {
    id: 'interactive',
    title: 'Interactive Objects',
    description: 'Click and interact with 3D objects using raycasting.',
    status: 'coming-soon',
  },
  {
    id: 'particles',
    title: 'Particle System',
    description: 'Dynamic particle effects for fire, smoke, and more.',
    status: 'coming-soon',
  },
  {
    id: 'physics',
    title: 'Physics Simulation',
    description: 'Realistic physics with gravity, collisions, and constraints.',
    status: 'coming-soon',
  },
  {
    id: 'animation',
    title: 'Animated Characters',
    description: 'Skeletal animation and motion blending.',
    status: 'coming-soon',
  },
  {
    id: 'ar',
    title: 'Augmented Reality',
    description: 'WebXR integration for AR experiences.',
    status: 'experimental',
  },
]);

/**
 * Selected scene for preview
 */
const selectedScene = ref<Scene | null>(null);

/**
 * Dialog visibility computed
 */
const showDialog = computed(() => selectedScene.value !== null);

/**
 * Open scene preview
 */
const openScene = (scene: Scene) => {
  if (scene.status === 'coming-soon') {
    return;
  }
  selectedScene.value = scene;
};

/**
 * Close scene preview
 */
const closeScene = () => {
  selectedScene.value = null;
};

/**
 * Get status badge color
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ready':
      return 'positive';
    case 'experimental':
      return 'warning';
    default:
      return 'grey';
  }
};

/**
 * Get status label
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'experimental':
      return 'Experimental';
    default:
      return 'Coming Soon';
  }
};
</script>

<template>
  <q-page
    class="babylonjs-page q-pa-xl"
    role="region"
    aria-labelledby="babylonjs-heading"
  >
    <header class="q-mb-xl">
      <h1 id="babylonjs-heading" class="text-h4 text-weight-bold text-primary q-mb-sm">
        BabylonJS 3D Scenes
      </h1>
      <p class="text-body1 text-grey-7">
        Experience interactive 3D graphics powered by the Babylon.js engine.
        From basic scenes to complex simulations.
      </p>
    </header>

    <!-- Info Banner -->
    <q-banner class="bg-primary text-white rounded-borders q-mb-xl">
      <template #avatar>
        <q-icon name="info" />
      </template>
      <p class="q-ma-none">
        Babylon.js is a powerful 3D engine for the web. Click on any scene to learn more.
      </p>
      <template #action>
        <q-btn
          flat
          label="Documentation"
          color="white"
          href="https://doc.babylonjs.com"
          target="_blank"
          rel="noopener noreferrer"
        />
      </template>
    </q-banner>

    <!-- Scenes Grid -->
    <section aria-labelledby="scenes-heading">
      <h2 id="scenes-heading" class="visually-hidden">Available 3D Scenes</h2>

      <div class="scenes-grid">
        <article
          v-for="scene in scenes"
          :key="scene.id"
          class="scene-card"
        >
          <q-card
            class="scene-content"
            :class="{ disabled: scene.status === 'coming-soon' }"
            clickable
            @click="openScene(scene)"
            :tabindex="scene.status !== 'coming-soon' ? 0 : -1"
            role="button"
            :aria-label="`${scene.title}: ${scene.description}. Status: ${getStatusLabel(scene.status)}`"
          >
            <!-- Thumbnail -->
            <div class="scene-thumbnail bg-grey-3 flex flex-center">
              <q-icon name="view_in_ar" size="64px" color="grey-5" />
            </div>

            <q-card-section>
              <div class="row items-center q-mb-sm">
                <h3 class="text-subtitle1 text-weight-bold q-ma-none flex-grow-1">
                  {{ scene.title }}
                </h3>
                <q-badge
                  :color="getStatusColor(scene.status)"
                  :label="getStatusLabel(scene.status)"
                />
              </div>
              <p class="text-body2 text-grey-7">{{ scene.description }}</p>
            </q-card-section>

            <q-card-actions v-if="scene.status !== 'coming-soon'">
              <q-btn
                flat
                color="primary"
                label="Launch"
                :aria-label="`Launch ${scene.title} scene`"
              />
            </q-card-actions>
          </q-card>
        </article>
      </div>
    </section>

    <!-- Scene Preview Dialog -->
    <q-dialog
      v-model="showDialog"
      persistent
      transition-show="scale"
      transition-hide="scale"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="selectedScene ? 'scene-dialog-title' : undefined"
    >
      <q-card v-if="selectedScene" style="min-width: 600px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6" id="scene-dialog-title">
            {{ selectedScene.title }}
          </div>
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            v-close-popup
            aria-label="Close dialog"
          />
        </q-card-section>

        <q-card-section>
          <!-- BabylonJS Scene Component -->
          <BabylonBasicScene v-if="selectedScene.id === 'basic'" />
          <!-- Placeholder for other scenes -->
          <div
            v-else
            class="scene-canvas bg-grey-3 rounded-borders flex flex-center"
            style="min-height: 400px"
            role="img"
            :aria-label="`3D preview of ${selectedScene.title}`"
          >
            <div class="text-center text-grey-6">
              <q-icon name="view_in_ar" size="80px" />
              <p class="q-mt-md text-h6">Scene Preview</p>
              <p class="text-body2">{{ selectedScene.description }}</p>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Close"
            color="primary"
            v-close-popup
          />
          <q-btn
            unelevated
            label="Launch Full Screen"
            color="secondary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Features List -->
    <section class="q-mt-xl">
      <h2 class="text-h6 q-mb-md">What You Can Build</h2>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-card class="q-pa-md">
            <q-icon name="games" size="32px" color="primary" class="q-mb-sm" />
            <div class="text-subtitle1">Games</div>
            <div class="text-body2 text-grey-7">
              Create engaging 3D games with physics, animations, and multiplayer support.
            </div>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card class="q-pa-md">
            <q-icon name="architecture" size="32px" color="secondary" class="q-mb-sm" />
            <div class="text-subtitle1">Visualizations</div>
            <div class="text-body2 text-grey-7">
              Build 3D data visualizations, architectural walkthroughs, and simulations.
            </div>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card class="q-pa-md">
            <q-icon name="vrpano" size="32px" color="accent" class="q-mb-sm" />
            <div class="text-subtitle1">VR/AR</div>
            <div class="text-body2 text-grey-7">
              Immersive virtual and augmented reality experiences for web and devices.
            </div>
          </q-card>
        </div>
      </div>
    </section>
  </q-page>
</template>

<style lang="scss" scoped>
.babylonjs-page {
  max-width: 1200px;
  margin: 0 auto;
}

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

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.scene-card {
  transition: transform 0.2s ease;

  &:hover:not(.disabled) {
    transform: translateY(-4px);
  }
}

.scene-content {
  height: 100%;

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.scene-thumbnail {
  height: 180px;
}

/**
 * Responsive
 */
@media (max-width: 599px) {
  .babylonjs-page {
    padding: 16px;
  }

  .scenes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
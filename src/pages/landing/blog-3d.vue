<script setup lang="ts">
/**
 * Blog 3D Page
 *
 * Blog page with 3D element using Babylon.js.
 *
 * @page
 */

import { useMeta } from 'quasar';
import BabylonBasicScene from '@/components/landing/BabylonBasicScene.vue';

useMeta({
  title: 'Blog - 3D Element',
  meta: {
    description: 'Blog with 3D visualization.',
  },
});
</script>

<template>
  <q-page class="blog-3d-page q-pa-xl">
    <header class="q-mb-lg">
      <h1 class="text-h4 text-weight-bold text-primary">
        Blog - 3D Element
      </h1>
      <p class="text-body1 text-grey-7">
        Blog post with interactive 3D visualization using Babylon.js.
      </p>
    </header>

    <div class="blog-content q-mb-lg">
      <q-card class="q-pa-lg">
        <h2 class="text-h5 q-mb-md">Interactive 3D Scene</h2>
        <p class="text-body1 text-grey-7 q-mb-md">
          This blog post features an interactive 3D element. You can rotate the camera
          by clicking and dragging on the 3D canvas below.
        </p>
        
        <div class="canvas-container">
          <BabylonBasicScene :initial-fps="30" />
        </div>

        <p class="text-body2 text-grey-7 q-mt-md">
          The 3D scene demonstrates a simple interactive element that can be embedded
          in blog posts to create engaging content experiences.
        </p>
      </q-card>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.blog-3d-page {
  max-width: 1200px;
  margin: 0 auto;
}

.canvas-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
}
</style>
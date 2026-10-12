<script setup lang="ts">
/**
 * Blog Blank Page
 *
 * Empty template page for custom blog layouts.
 * Use this as a starting point for your own blog design.
 *
 * @page
 */

import { useMeta } from 'quasar';

useMeta({
  title: 'Blog - Blank Template',
  meta: {
    description: 'Customize this blank blog template.',
  },
});
</script>

<template>
  <q-page class="blog-blank-page q-pa-xl">
    <header class="q-mb-xl">
      <h1 class="text-h4 text-weight-bold text-primary">
        Blog
      </h1>
      <p class="text-body1 text-grey-7">
        Customize this blank template for your own blog design.
      </p>
    </header>

    <div class="empty-template q-pa-xl bg-grey-1 rounded-borders text-center">
      <q-icon name="edit_note" size="64px" color="grey-4" />
      <p class="text-h6 text-grey-6 q-mt-md">Blank Template</p>
      <p class="text-body2 text-grey-5">
        Add your custom content here.
      </p>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.blog-blank-page {
  max-width: 1200px;
  margin: 0 auto;
}

.empty-template {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
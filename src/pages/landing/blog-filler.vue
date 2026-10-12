<script setup lang="ts">
/**
 * Blog Filler Page
 *
 * Blog page with placeholder filler text for layout testing.
 *
 * @page
 */

import { useMeta } from 'quasar';

useMeta({
  title: 'Blog - Filler',
  meta: {
    description: 'Placeholder blog post for layout testing.',
  },
});
</script>

<template>
  <q-page class="blog-filler-page q-pa-xl">
    <header class="q-mb-xl">
      <h1 class="text-h4 text-weight-bold text-primary">
        Blog Post Title Here
      </h1>
      <p class="text-body2 text-grey-6">
        Published on May 16, 2026 · By Author Name
      </p>
    </header>

    <q-card class="blog-content q-pa-lg">
      <p class="text-body1 q-mb-md">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
        nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>

      <p class="text-body1 q-mb-md">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
        eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
        in culpa qui officia deserunt mollit anim id est laborum.
      </p>

      <h2 class="text-h6 q-mt-lg q-mb-md">Section Heading Here</h2>

      <p class="text-body1 q-mb-md">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
        doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
        veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      </p>

      <p class="text-body1 q-mb-md">
        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
        sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
      </p>

      <q-banner class="bg-grey-2 q-my-lg" rounded>
        <template #avatar>
          <q-icon name="format_quote" color="grey-6" />
        </template>
        <p class="text-body1 q-ma-none">
          This is a sample blockquote. It can be used to highlight important quotes
          or callouts within blog posts.
        </p>
      </q-banner>

      <h2 class="text-h6 q-mt-lg q-mb-md">Another Section</h2>

      <p class="text-body1 q-mb-md">
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis 
        praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias 
        excepturi sint occaecati cupiditate non provident.
      </p>

      <p class="text-body1 q-mb-md">
        Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit 
        quo minus id quod maxime placeat facere possimus.
      </p>

      <q-list bordered separator class="q-mt-md rounded-borders">
        <q-item>
          <q-item-section>
            <q-item-label>First list item</q-item-label>
            <q-item-label caption>Description text here</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>Second list item</q-item-label>
            <q-item-label caption>Description text here</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>Third list item</q-item-label>
            <q-item-label caption>Description text here</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <p class="text-body1 q-mb-md q-mt-lg">
        Final paragraph here. This is filler text that can be used to test blog layouts,
        typography, and overall page design before real content is added.
      </p>
    </q-card>
  </q-page>
</template>

<style lang="scss" scoped>
.blog-filler-page {
  max-width: 800px;
  margin: 0 auto;
}
</style>
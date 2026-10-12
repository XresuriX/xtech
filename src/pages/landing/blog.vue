<script setup lang="ts">
/**
 * Blog Page
 *
 * Displays blog posts loaded from Supabase.
 * Includes post list with excerpts and read more links.
 *
 * @page
 * @accessibility
 * - Uses article elements for posts
 * - Proper heading hierarchy
 * - Descriptive link text
 *
 * @responsive
 * - Single column on mobile
 * - Grid on desktop
 *
 * @todo Implement Supabase integration
 */

import { ref, computed } from 'vue';
import { useMeta } from 'quasar';

useMeta({
  title: 'Blog - XTech',
  meta: {
    description: 'Latest news, updates and articles from XTech.',
  },
});

/**
 * Blog post interface
 */
interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  author?: string;
  image?: string;
  tags?: string[];
}

/**
 * Sample blog posts (placeholder data)
 * @todo Replace with Supabase data
 */
const posts = ref<BlogPost[]>([
  {
    id: 1,
    title: 'Getting Started with XTech',
    excerpt: 'Learn how to get started with our platform and discover all the features available to you.',
    date: '2026-01-15',
    author: 'XTech Team',
    tags: ['Getting Started', 'Tutorial'],
  },
  {
    id: 2,
    title: 'Latest Tech Updates',
    excerpt: 'Check out what is new and exciting in our latest update. Improved performance and new features.',
    date: '2026-02-01',
    author: 'XTech Team',
    tags: ['Updates', 'News'],
  },
  {
    id: 3,
    title: 'Community Highlights',
    excerpt: 'Discover what our community has been building and see how others are using XTech.',
    date: '2026-03-01',
    author: 'Community',
    tags: ['Community', 'Showcase'],
  },
]);

/**
 * Loading state
 */
const loading = ref(false);

/**
 * Filter by tag
 */
const selectedTag = ref<string | null>(null);

/**
 * Available tags
 */
const allTags = computed(() => {
  const tags = new Set<string>();
  posts.value.forEach(post => {
    post.tags?.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
});

/**
 * Filtered posts
 */
const filteredPosts = computed(() => {
  if (!selectedTag.value) return posts.value;
  return posts.value.filter(post => post.tags?.includes(selectedTag.value!));
});

/**
 * Format date
 * @param date - Date string
 * @returns Formatted date
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <q-page
    class="blog-page q-pa-xl"
    role="region"
    aria-labelledby="blog-heading"
  >
    <header class="q-mb-xl">
      <h1 id="blog-heading" class="text-h4 text-weight-bold text-primary q-mb-sm">
        Blog
      </h1>
      <p class="text-body1 text-grey-7">
        Stay updated with the latest news, tutorials, and insights from XTech.
      </p>
    </header>

    <!-- Tag Filter -->
    <div v-if="allTags.length > 0" class="tag-filter q-mb-lg">
      <div class="text-subtitle2 q-mb-sm">Filter by tag:</div>
      <q-btn-group flat>
        <q-btn
          :flat="selectedTag !== null"
          :unelevated="selectedTag === null"
          :color="selectedTag === null ? 'primary' : 'grey-7'"
          label="All"
          @click="selectedTag = null"
          :aria-pressed="selectedTag === null"
        />
        <q-btn
          v-for="tag in allTags"
          :key="tag"
          :flat="selectedTag !== tag"
          :unelevated="selectedTag === tag"
          :color="selectedTag === tag ? 'secondary' : 'grey-7'"
          :label="tag"
          @click="selectedTag = tag"
          :aria-pressed="selectedTag === tag"
        />
      </q-btn-group>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots size="48px" color="primary" />
      <p class="q-mt-md text-grey-6">Loading posts...</p>
    </div>

    <!-- Posts Grid -->
    <div v-else-if="filteredPosts.length > 0" class="posts-grid">
      <article
        v-for="post in filteredPosts"
        :key="post.id"
        class="post-card"
      >
        <q-card class="post-content">
          <!-- Post Image Placeholder -->
          <div class="post-image bg-grey-3 flex flex-center" style="height: 200px">
            <q-icon name="article" size="48px" color="grey-5" />
          </div>

          <q-card-section>
            <!-- Tags -->
            <div v-if="post.tags" class="post-tags q-mb-sm">
              <q-chip
                v-for="tag in post.tags"
                :key="tag"
                dense
                size="sm"
                color="grey-3"
              >
                {{ tag }}
              </q-chip>
            </div>

            <!-- Title -->
            <h2 class="text-h6 q-mb-sm">
              <router-link :to="`/blog/${post.id}`" class="post-link">
                {{ post.title }}
              </router-link>
            </h2>

            <!-- Meta -->
            <div class="text-caption text-grey-6 q-mb-md">
              <span>{{ formatDate(post.date) }}</span>
              <span v-if="post.author"> · {{ post.author }}</span>
            </div>

            <!-- Excerpt -->
            <p class="text-body2 text-grey-7">{{ post.excerpt }}</p>
          </q-card-section>

          <q-card-actions>
            <q-btn
              flat
              color="primary"
              label="Read More"
              :aria-label="`Read full article: ${post.title}`"
            />
          </q-card-actions>
        </q-card>
      </article>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state text-center q-pa-xl">
      <q-icon name="article" size="64px" color="grey-4" />
      <p class="text-h6 text-grey-6 q-mt-md">No posts found</p>
      <p class="text-body2 text-grey-5">Check back later for new content.</p>
    </div>

    <!-- Coming Soon Banner -->
    <q-banner class="bg-grey-2 rounded-borders q-mt-xl" role="status">
      <template #avatar>
        <q-icon name="info" color="grey-7" />
      </template>
      <p class="q-ma-none">
        Blog posts are loaded from Supabase. Full integration coming soon.
      </p>
      <template #action>
        <q-btn
          flat
          label="Learn About Supabase"
          color="primary"
          href="https://supabase.com"
          target="_blank"
        />
      </template>
    </q-banner>
  </q-page>
</template>

<style lang="scss" scoped>
.blog-page {
  max-width: 1200px;
  margin: 0 auto;
}

.tag-filter {
  overflow-x: auto;
  padding-bottom: 8px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.post-card {
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.post-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.post-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--q-primary);
  }
}

.post-image {
  border-radius: 0;
}

.empty-state {
  background: #fafafa;
  border-radius: 12px;
}

/**
 * Responsive
 */
@media (max-width: 599px) {
  .blog-page {
    padding: 16px;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
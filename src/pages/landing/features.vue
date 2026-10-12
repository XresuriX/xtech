<script setup lang="ts">
/**
 * Features Page
 *
 * Displays the main features of XTech with cards and icons.
 *
 * @page
 * @accessibility
 * - Uses semantic article elements for feature cards
 * - Proper heading structure
 * - Icon decorative elements have aria-hidden
 *
 * @responsive
 * - Single column on mobile
 * - 3-column grid on desktop
 *
 * @todo Complete features implementation with actual data from backend
 */

import { useMeta } from 'quasar';

useMeta({
  title: 'Features - XTech',
  meta: {
    description: 'Explore XTech features: Cloud Solutions, AI & Machine Learning, and Enterprise Security.',
  },
});

/**
 * Feature data structure
 * @interface Feature
 * @property {string} title - Feature title
 * @property {string} description - Feature description
 * @property {string} icon - Material icon name
 * @property {string} [link] - Optional link to feature details
 */
interface Feature {
  title: string;
  description: string;
  icon: string;
  link?: string;
}

/**
 * Features list
 * @type {Feature[]}
 */
const features: Feature[] = [
  {
    title: 'Cloud Solutions',
    description: 'Scalable cloud infrastructure for modern applications. Deploy globally with enterprise-grade reliability.',
    icon: 'cloud',
    link: '/features/cloud',
  },
  {
    title: 'AI & Machine Learning',
    description: 'Intelligent automation powered by cutting-edge AI. Build smarter applications with our ML tools.',
    icon: 'psychology',
    link: '/features/ai',
  },
  {
    title: 'Security',
    description: 'Enterprise-grade security to protect your data. Advanced encryption and compliance standards.',
    icon: 'security',
    link: '/features/security',
  },
];

/**
 * Upcoming features (placeholder data)
 * @type {Feature[]}
 */
const upcomingFeatures: Feature[] = [
  { title: 'Analytics', description: 'Real-time data analytics dashboard', icon: 'analytics' },
  { title: 'Integration', description: 'Connect with 100+ third-party services', icon: 'hub' },
  { title: 'Automation', description: 'Workflow automation tools', icon: 'settings_suggest' },
];
</script>

<template>
  <q-page
    class="features-page q-pa-xl"
    role="region"
    aria-labelledby="features-heading"
  >
    <!-- Page Heading -->
    <header class="q-mb-xl">
      <h1 id="features-heading" class="text-h4 text-weight-bold text-primary q-mb-sm">
        Features
      </h1>
      <p class="text-body1 text-grey-7">
        Discover the powerful features that make XTech the choice for modern businesses.
      </p>
    </header>

    <!-- Main Features Grid -->
    <section aria-labelledby="main-features-heading">
      <h2 id="main-features-heading" class="visually-hidden">
        Main Features
      </h2>

      <div class="row q-col-gutter-md q-mb-xl">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="col-12 col-md-4"
        >
          <q-card
            class="feature-card"
            :aria-label="`${feature.title}: ${feature.description}`"
          >
            <q-card-section>
              <q-icon
                :name="feature.icon"
                size="48px"
                color="secondary"
                class="q-mb-md feature-icon"
                aria-hidden="true"
              />
              <h3 class="text-h6 q-mt-md">{{ feature.title }}</h3>
              <p class="text-body2 text-grey-7">{{ feature.description }}</p>
            </q-card-section>
            <q-card-actions v-if="feature.link">
              <q-btn
                flat
                color="primary"
                :label="`Learn more about ${feature.title}`"
                :to="feature.link"
              />
            </q-card-actions>
          </q-card>
        </article>
      </div>
    </section>

    <!-- Coming Soon Banner -->
    <section
      aria-labelledby="upcoming-heading"
      class="q-mt-xl"
    >
      <h2 id="upcoming-heading" class="text-h6 q-mb-md">
        Coming Soon
      </h2>

      <q-banner class="bg-grey-2 rounded-borders" role="status">
        <template #avatar>
          <q-icon name="schedule" color="warning" aria-hidden="true" />
        </template>
        <p class="q-ma-none">
          More exciting features are under development. Stay tuned for updates!
        </p>
        <template #action>
          <q-btn
            flat
            label="Subscribe for Updates"
            color="primary"
            aria-label="Subscribe to get feature updates"
          />
        </template>
      </q-banner>

      <!-- Upcoming Features Preview -->
      <div class="row q-col-gutter-md q-mt-lg">
        <div
          v-for="feature in upcomingFeatures"
          :key="feature.title"
          class="col-12 col-sm-4"
        >
          <q-card class="upcoming-card bg-grey-1">
            <q-card-section class="text-center">
              <q-icon
                :name="feature.icon"
                size="32px"
                color="grey-6"
                class="q-mb-sm"
                aria-hidden="true"
              />
              <div class="text-subtitle2">{{ feature.title }}</div>
              <div class="text-caption text-grey-6">{{ feature.description }}</div>
              <q-badge color="warning" label="Coming Soon" class="q-mt-sm" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>
  </q-page>
</template>

<style lang="scss" scoped>
.features-page {
  max-width: 1200px;
  margin: 0 auto;
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

.feature-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.feature-icon {
  transition: transform 0.3s ease;

  .feature-card:hover & {
    transform: scale(1.1);
  }
}

.upcoming-card {
  opacity: 0.8;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

/**
 * Responsive adjustments
 */
@media (max-width: 599px) {
  .features-page {
    padding: 24px 16px;
  }

  .feature-card {
    margin-bottom: 16px;
  }
}
</style>
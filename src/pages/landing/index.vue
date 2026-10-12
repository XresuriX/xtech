<script setup lang="ts">
/**
 * Landing Home Page
 *
 * Main landing page for XTech with welcome message and CTA buttons.
 *
 * @page
 * @accessibility
 * - Uses proper heading hierarchy (h1)
 * - Has descriptive alt text for any images
 * - Button labels are descriptive
 *
 * @responsive
 * - Full width on mobile with padding adjustments
 * - Centered layout on all devices
 */

import { useMeta } from 'quasar';

useMeta({
  title: 'XTech - Innovative Tech Solutions',
  meta: {
    description: 'XTech provides innovative tech solutions for the modern world. Explore our features, demos, and more.',
  },
});
</script>

<template>
  <q-page
    class="home-page flex flex-center column q-pa-xl"
    role="region"
    aria-label="Welcome section"
  >
    <div class="home-content text-center">
      <!-- Main Heading -->
      <h1 class="text-h3 text-weight-bold text-primary q-mb-md">
        Welcome to <span class="text-secondary">XTech</span>
      </h1>

      <!-- Description -->
      <p
        class="text-body1 text-grey-7 q-mb-lg home-description"
        style="max-width: 600px"
      >
        Innovative tech solutions for the modern world.
        Explore our features, demos, and more.
      </p>

      <!-- CTA Buttons -->
      <div
        class="q-gutter-md cta-buttons"
        role="group"
        aria-label="Main actions"
      >
        <q-btn
          to="/features"
          color="primary"
          label="Explore Features"
          size="lg"
          icon="star"
          aria-label="Explore our features and services"
          unelevated
        />
        <q-btn
          to="/demo"
          color="secondary"
          label="View Demo"
          size="lg"
          icon="play_circle"
          aria-label="View our interactive demos"
          outline
        />
      </div>

      <!-- Quick Links Section -->
      <div class="quick-links q-mt-xl" role="navigation" aria-label="Quick links">
        <div class="row q-col-gutter-md justify-center">
          <div class="col-12 col-sm-6 col-md-4">
            <q-card
              class="quick-link-card"
              clickable
              to="/blog"
              tabindex="0"
              role="button"
              aria-label="Visit our blog"
            >
              <q-card-section class="text-center">
                <q-icon name="article" size="32px" color="primary" class="q-mb-sm" />
                <div class="text-subtitle1">Blog</div>
                <div class="text-caption text-grey-7">Latest news & updates</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-card
              class="quick-link-card"
              clickable
              to="/babylonjs"
              tabindex="0"
              role="button"
              aria-label="View BabylonJS demos"
            >
              <q-card-section class="text-center">
                <q-icon name="view_in_ar" size="32px" color="secondary" class="q-mb-sm" />
                <div class="text-subtitle1">3D Demos</div>
                <div class="text-caption text-grey-7">Interactive 3D scenes</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <q-card
              class="quick-link-card"
              clickable
              to="/contact"
              tabindex="0"
              role="button"
              aria-label="Contact us"
            >
              <q-card-section class="text-center">
                <q-icon name="contact_mail" size="32px" color="accent" class="q-mb-sm" />
                <div class="text-subtitle1">Contact</div>
                <div class="text-caption text-grey-7">Get in touch</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: calc(100vh - 100px);
}

.home-content {
  max-width: 900px;
  width: 100%;
}

.home-description {
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.quick-link-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
  }
}

/**
 * Responsive adjustments
 */
@media (max-width: 599px) {
  .home-page {
    padding: 24px 16px;
  }

  .text-h3 {
    font-size: 1.75rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: stretch;

    .q-btn {
      width: 100%;
    }
  }
}
</style>
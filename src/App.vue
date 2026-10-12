<script setup lang="ts">
/**
 * Main Application Entry Component
 *
 * Root Vue component for XTech landing page application.
 *
 * @app
 * @accessibility
 * - Provides proper lang attribute for screen readers
 * - Sets up global keyboard shortcuts
 */

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { logger } from '@/utils/logger';
import FirstVisitWelcome from '@/components/landing/FirstVisitWelcome.vue';

const router = useRouter();

/** Show first visit welcome */
const showWelcome = ref(false);

/** Check if first visit */
const checkFirstVisit = () => {
  // In dev mode, always show welcome
  if (import.meta.env.DEV) {
    // Check if already dismissed
    const dismissed = sessionStorage.getItem('xtech_welcome_dismissed');
    if (!dismissed) {
      showWelcome.value = true;
    }
    return;
  }

  // In production, check localStorage
  const hasVisited = localStorage.getItem('xtech_first_visit_shown');
  if (!hasVisited) {
    showWelcome.value = true;
  }
};

/**
 * Handle welcome close
 */
const handleWelcomeClose = () => {
  showWelcome.value = false;
  sessionStorage.setItem('xtech_welcome_dismissed', 'true');
};

/**
 * Handle navigation from welcome
 */
const handleWelcomeNavigate = (path: string) => {
  showWelcome.value = false;
  sessionStorage.setItem('xtech_welcome_dismissed', 'true');
  router.push(path);
};

/**
 * Handle skip from welcome
 */
const handleWelcomeSkip = () => {
  showWelcome.value = false;
  sessionStorage.setItem('xtech_welcome_dismissed', 'true');
};

onMounted(() => {
  logger.info('XTech Landing Page initialized');
  checkFirstVisit();
});
</script>

<template>
  <router-view />

  <!-- First Visit Welcome Modal -->
  <FirstVisitWelcome
    :show="showWelcome"
    @close="handleWelcomeClose"
    @navigate="handleWelcomeNavigate"
    @skip="handleWelcomeSkip"
  />
</template>
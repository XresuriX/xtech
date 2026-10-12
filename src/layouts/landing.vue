<script setup lang="ts">
/**
 * Landing Layout Component
 *
 * Main layout for the landing pages with responsive navigation.
 * Provides accessibility features including ARIA labels, skip links,
 * and proper semantic structure.
 *
 * @component
 * @layout
 * @accessibility
 * - Uses semantic HTML5 elements (header, nav, main, footer)
 * - Provides skip-to-content link for keyboard users
 * - Uses ARIA labels for interactive elements
 * - Supports keyboard navigation
 *
 * @responsive
 * - Mobile: hamburger menu with slide-out drawer
 * - Desktop: horizontal navigation bar
 */

import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const drawerOpen = ref(false);
const isMobile = ref(false);

// Navigation items with accessibility attributes
const navItems = [
  { label: 'Home', path: '/', icon: 'home', ariaLabel: 'Go to home page' },
  { label: 'Features', path: '/features', icon: 'star', ariaLabel: 'View features' },
  { label: 'Blog', path: '/blog', icon: 'article', ariaLabel: 'Read our blog' },
  { label: 'BabylonJS', path: '/babylonjs', icon: 'view_in_ar', ariaLabel: 'View 3D demos' },
  { label: 'Demo', path: '/demo', icon: 'play_circle', ariaLabel: 'View demos' },
  { label: 'Contact', path: '/contact', icon: 'contact_mail', ariaLabel: 'Contact us' },
];

/**
 * Check if viewport is mobile
 * @private
 */
const checkMobile = () => {
  isMobile.value = $q.screen.lt.md;
};

/**
 * Handle drawer close on navigation
 * @public
 */
const closeDrawer = () => {
  drawerOpen.value = false;
};

/**
 * Handle keyboard navigation in drawer
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && drawerOpen.value) {
    closeDrawer();
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('keydown', handleKeydown);
});
</script>

<template>
  <q-layout view="hHh LpR fFf" class="landing-layout">
    <!-- Skip to content link for accessibility -->
    <a
      href="#main-content"
      class="skip-link"
    >
      Skip to main content
    </a>

    <q-header
      bordered
      class="bg-white text-dark landing-header"
      role="banner"
    >
      <q-toolbar class="q-px-md">
        <!-- Logo/Brand -->
        <q-toolbar-title class="text-weight-bold cursor-pointer" @click="$router.push('/')">
          <span class="text-primary" aria-hidden="true">X</span>Tech
          <span class="visually-hidden">XTech Home</span>
        </q-toolbar-title>

        <!-- Desktop Navigation -->
        <nav
          class="gt-sm navigation-desktop"
          role="navigation"
          aria-label="Main navigation"
        >
          <q-btn
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            flat
            :label="item.label"
            :aria-label="item.ariaLabel"
            :class="{ 'text-primary': $route.path === item.path }"
            class="nav-link q-ml-sm"
          />
        </nav>

        <!-- Mobile Menu Button -->
        <q-btn
          v-if="isMobile"
          flat
          round
          dense
          icon="menu"
          aria-label="Open navigation menu"
          aria-expanded="false"
          class="lt-md mobile-menu-btn"
          @click="drawerOpen = !drawerOpen"
        />
      </q-toolbar>
    </q-header>

    <!-- Mobile Navigation Drawer -->
    <q-drawer
      v-model="drawerOpen"
      side="right"
      overlay
      behavior="mobile"
      class="mobile-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Navigation</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Close navigation menu"
          @click="closeDrawer"
        />
      </q-toolbar>

      <q-list role="navigation" aria-label="Mobile navigation">
        <q-item
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          clickable
          :aria-label="item.ariaLabel"
          @click="closeDrawer"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Main Content Area -->
    <q-page-container>
      <main id="main-content" role="main">
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </q-page-container>

    <!-- Footer -->
    <q-footer
      class="bg-primary text-white landing-footer"
      role="contentinfo"
    >
      <q-toolbar class="q-py-md">
        <div class="footer-content">
          <div class="text-center">
            <p class="q-ma-none">
              &copy; {{ new Date().getFullYear() }} XTech. All rights reserved.
            </p>
            <nav aria-label="Footer navigation" class="q-mt-sm">
              <q-btn
                v-for="item in navItems.slice(0, 3)"
                :key="item.path"
                :to="item.path"
                flat
                dense
                size="sm"
                :label="item.label"
                :aria-label="item.ariaLabel"
                class="footer-link"
              />
            </nav>
          </div>
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<style lang="scss" scoped>
/**
 * Skip link for accessibility
 * Hidden visually but accessible to screen readers
 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--q-primary);
  color: white;
  padding: 8px 16px;
  z-index: 1000;
  transition: top 0.3s;
  text-decoration: none;
  border-radius: 0 0 4px 0;

  &:focus {
    top: 0;
  }
}

/**
 * Visually hidden utility class
 * For screen reader only content
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
 * Navigation styles
 */
.navigation-desktop {
  display: flex;
  align-items: center;
}

.nav-link {
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    background: rgba(30, 58, 138, 0.08);
    border-radius: 8px;
  }
}

.mobile-menu-btn {
  margin-left: 8px;
}

/**
 * Footer styles
 */
.footer-content {
  width: 100%;
}

.footer-link {
  color: rgba(255, 255, 255, 0.8);

  &:hover {
    color: white;
  }
}

/**
 * Transition animations
 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/**
 * Responsive adjustments
 */
@media (max-width: 599px) {
  .landing-header {
    .q-toolbar {
      padding: 8px 12px;
    }
  }
}
</style>
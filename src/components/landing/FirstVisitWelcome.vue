<script setup lang="ts">
/**
 * First Visit Welcome Component
 *
 * A welcome modal/dialog shown only on the first visit to the site.
 * Provides a quick tour and allows users to get started quickly.
 *
 * @component
 * @example
 * <FirstVisitWelcome :show="showWelcome" @close="handleClose" />
 *
 * @accessibility
 * - Uses ARIA dialog attributes
 * - Trap focus within modal
 * - Keyboard navigation support (Escape to close)
 * - Screen reader announcements
 *
 * @storage Uses localStorage to track first visit
 * - Key: 'xtech_first_visit_shown'
 * - Value: 'true' | 'false'
 */

import { ref, onMounted, watch, nextTick } from 'vue';

interface Props {
  /** Whether to show the welcome modal */
  show: boolean;
}

interface Emits {
  /** Close the welcome modal */
  (e: 'close'): void;
  /** Navigate to a specific page */
  (e: 'navigate', path: string): void;
  /** Skip the tour */
  (e: 'skip'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Current step in the welcome tour
 */
const currentStep = ref(0);

/**
 * Whether the modal is fully rendered
 */
const isReady = ref(false);

const isAnimating = ref(false);

/**
 * Welcome tour steps
 */
const tourSteps = [
  {
    title: 'Welcome to ',
    description: 'Better tech for a better world',
    icon: 'rocket_launch',
    action: 'Start Tour',
  },
];

/**
 * Check if this is the first visit
 * @returns {boolean} True if first visit
 */
const checkFirstVisit = (): boolean => {
  if (import.meta.env.DEV) return true; // Always show in dev mode

  const hasVisited = localStorage.getItem('xtech_first_visit_shown');
  return !hasVisited;
};

/**
 * Mark first visit as complete
 */
const markFirstVisitComplete = (): void => {
  localStorage.setItem('xtech_first_visit_shown', 'true');
};

/**
 * Reset first visit (for testing)
 */
const resetFirstVisit = (): void => {
  localStorage.removeItem('xtech_first_visit_shown');
};

/**
 * Handle close action
 */
const handleClose = () => {
  isAnimating.value = true;
  setTimeout(() => {
    markFirstVisitComplete();
    emit('close');
    isAnimating.value = false;
  }, 300);
};


/**
 * Handle keyboard events
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.show) return;

  if (event.key === 'Escape') {
    handleClose();
  } 
};

/**
 * Focus trap for accessibility
 */
const modalRef = ref<HTMLElement | null>(null);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  nextTick(() => {
    isReady.value = true;
  });
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    currentStep.value = 0;
    nextTick(() => {
      const firstFocusable = modalRef.value?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    });
  }
});

const currentStepData = tourSteps[currentStep.value];
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show && isReady"
        class="welcome-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        @click.self="handleClose"
      >
        <div
          ref="modalRef"
          class="welcome-modal"
          :class="{ 'animating': isAnimating }"
          @keydown="handleKeydown"
        >

          <!-- Close Button -->
          <q-btn
            flat
            round
            dense
            icon="close"
            class="close-btn"
            aria-label="Skip welcome tour"
            @click="handleSkip"
          />

          <!-- Step Content -->
          <div class="step-content" :key="currentStep">
            <div class="icon-wrapper">
              
            </div>

            <h2 id="welcome-title" class="text-h5 text-weight-bold text-primary q-mt-lg">
              {{ currentStepData.title }}
            </h2>

            <p class="text-body1 text-grey-7 q-my-lg step-description">
              {{ currentStepData.description }}
            </p>

            
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.welcome-modal {
  background: white;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, opacity 0.3s ease;

  &.animating {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e3a8a, #f59e0b);
  transition: width 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}

.step-content {
  padding: 32px;
  text-align: center;
}

.icon-wrapper {
  margin-bottom: 16px;
}

.step-description {
  min-height: 60px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.step-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 0 0 16px 16px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: #ccc;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: #999;
  }

  &.active {
    background: #1e3a8a;
    transform: scale(1.3);
  }

  &:focus-visible {
    outline: 2px solid #1e3a8a;
    outline-offset: 2px;
  }
}

.skip-section {
  text-align: center;
  padding-bottom: 16px;
}

/**
 * Transitions
 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/**
 * Responsive
 */
@media (max-width: 599px) {
  .welcome-modal {
    max-height: 85vh;
  }

  .step-content {
    padding: 24px 16px;
  }

  .text-h5 {
    font-size: 1.25rem;
  }
}
</style>
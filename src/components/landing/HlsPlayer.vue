<script setup lang="ts">
/**
 * HLS Video Player Component
 *
 * HTTP Live Streaming video player using hls.js library.
 * Supports adaptive bitrate, multiple quality levels, and custom controls.
 *
 * @component
 * @example
 * <HlsPlayer
 *   src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
 *   poster="thumbnail.jpg"
 * />
 *
 * @accessibility
 * - Full keyboard navigation
 * - Screen reader announcements
 * - ARIA labels on all controls
 *
 * @features
 * - Adaptive bitrate streaming
 * - Quality selection
 * - Custom controls (play/pause, seek, volume, fullscreen)
 * - Fullscreen toggle
 * - Picture-in-Picture support
 */

import { ref, onMounted, onUnmounted, computed } from 'vue';
import Hls from 'hls.js';

interface Props {
  /** HLS stream URL */
  src?: string;
  /** Poster image URL */
  poster?: string;
  /** Auto play on load */
  autoplay?: boolean;
  /** Start muted */
  muted?: boolean;
}

interface Emits {
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'ended'): void;
  (e: 'error', error: Error): void;
  (e: 'loaded'): void;
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  autoplay: false,
  muted: false,
});

const emit = defineEmits<Emits>();

/** Video element reference */
const videoRef = ref<HTMLVideoElement | null>(null);

/** Hls.js instance */
const hls = ref<Hls | null>(null);

/** Playing state */
const isPlaying = ref(false);

/** Current time in seconds */
const currentTime = ref(0);

/** Total duration in seconds */
const duration = ref(0);

/** Loading state */
const isLoading = ref(false);

/** Buffering state */
const isBuffering = ref(false);

/** Volume (0-1) */
const volume = ref(0.8);

/** Muted state */
const isMuted = ref(props.muted);

/** Show controls */
const showControls = ref(true);

/** Fullscreen state */
const isFullscreen = ref(false);

/** Available qualities */
const qualities = ref<{ height: number; index: number; label: string }[]>([]);

/** Current quality index */
const currentQuality = ref(-1);

/** Error state */
const hasError = ref(false);

/** Progress percentage */
const progress = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

/** Formatted current time */
const formattedCurrentTime = computed(() => formatTime(currentTime.value));

/** Formatted duration */
const formattedDuration = computed(() => formatTime(duration.value));

/**
 * Format seconds to MM:SS
 */
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Initialize HLS.js
 */
const initHls = () => {
  if (!videoRef.value || !props.src) return;

  isLoading.value = true;

  if (Hls.isSupported()) {
    hls.value = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
    });

    hls.value.loadSource(props.src);
    hls.value.attachMedia(videoRef.value);

    hls.value.on(Hls.Events.MANIFEST_PARSED, () => {
      isLoading.value = false;
      emit('loaded');
      updateQualities();

      if (props.autoplay) {
        play();
      }
    });

    hls.value.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
      currentQuality.value = data.level;
    });

    hls.value.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        hasError.value = true;
        emit('error', new Error(data.type + ': ' + data.details));
      }
    });
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    videoRef.value.src = props.src;
    isLoading.value = false;
    if (props.autoplay) {
      play();
    }
  } else {
    hasError.value = true;
    emit('error', new Error('HLS is not supported in this browser'));
  }
};

/**
 * Update available qualities
 */
const updateQualities = () => {
  if (!hls.value) return;

  const levels = hls.value.levels;
  qualities.value = levels.map((level, index) => ({
    height: level.height,
    index,
    label: `${level.height}p`,
  }));

  if (levels.length > 0) {
    currentQuality.value = hls.value.currentLevel;
  }
};

/**
 * Set video source
 */
const setSource = (src: string) => {
  if (hls.value) {
    hls.value.loadSource(src);
  } else if (videoRef.value) {
    videoRef.value.src = src;
  }
};

/**
 * Play video
 */
const play = async () => {
  if (!videoRef.value) return;

  try {
    await videoRef.value.play();
    isPlaying.value = true;
    emit('play');
  } catch (error) {
    console.error('Play error:', error);
  }
};

/**
 * Pause video
 */
const pause = () => {
  if (!videoRef.value) return;
  videoRef.value.pause();
  isPlaying.value = false;
  emit('pause');
};

/**
 * Toggle play/pause
 */
const togglePlay = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

/**
 * Seek to time
 */
const seek = (time: number) => {
  if (!videoRef.value) return;
  videoRef.value.currentTime = time;
};

/**
 * Handle progress bar click
 */
const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  const time = percent * duration.value;
  seek(time);
};

/**
 * Toggle mute
 */
const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (videoRef.value) {
    videoRef.value.muted = isMuted.value;
  }
};

/**
 * Handle volume change
 */
const handleVolumeChange = (newVolume: number) => {
  volume.value = newVolume;
  if (videoRef.value) {
    videoRef.value.volume = newVolume;
    isMuted.value = newVolume === 0;
  }
};

/**
 * Toggle fullscreen
 */
const toggleFullscreen = async () => {
  const container = videoRef.value?.parentElement;
  if (!container) return;

  try {
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
  }
};

/**
 * Change quality
 */
const changeQuality = (index: number) => {
  if (!hls.value) return;
  hls.value.currentLevel = index;
};

/**
 * Toggle picture-in-picture
 */
const togglePiP = async () => {
  if (!videoRef.value) return;

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoRef.value.requestPictureInPicture();
    }
  } catch (error) {
    console.error('PiP error:', error);
  }
};

/**
 * Handle video events
 */
const handleLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration;
  }
};

const handleTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime;
  }
};

const handleEnded = () => {
  isPlaying.value = false;
  emit('ended');
};

const handleWaiting = () => {
  isBuffering.value = true;
};

const handlePlaying = () => {
  isBuffering.value = false;
};

/**
 * Handle keyboard controls
 */
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case ' ':
    case 'k':
      event.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      event.preventDefault();
      seek(Math.min(duration.value, currentTime.value + 10));
      break;
    case 'ArrowLeft':
      event.preventDefault();
      seek(Math.max(0, currentTime.value - 10));
      break;
    case 'ArrowUp':
      event.preventDefault();
      handleVolumeChange(Math.min(1, volume.value + 0.1));
      break;
    case 'ArrowDown':
      event.preventDefault();
      handleVolumeChange(Math.max(0, volume.value - 0.1));
      break;
    case 'm':
      event.preventDefault();
      toggleMute();
      break;
    case 'f':
      event.preventDefault();
      toggleFullscreen();
      break;
  }
};

// Expose methods
defineExpose({
  play,
  pause,
  seek,
  setSource,
});

// Lifecycle
onMounted(() => {
  if (props.src) {
    initHls();
  }
});

onUnmounted(() => {
  if (hls.value) {
    hls.value.destroy();
  }
});
</script>

<template>
  <div
    class="hls-player"
    role="region"
    aria-label="HLS Video Player"
    @mousemove="showControls = true"
    @mouseleave="showControls = false"
  >
    <!-- Video Element -->
    <div class="video-container">
      <video
        ref="videoRef"
        class="video-element"
        :poster="poster"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @ended="handleEnded"
        @waiting="handleWaiting"
        @playing="handlePlaying"
        @keydown="handleKeydown"
        tabindex="0"
        preload="metadata"
      />

      <!-- Loading Overlay -->
      <div v-if="isLoading || isBuffering" class="video-overlay">
        <q-spinner-dots size="48px" color="white" />
      </div>

      <!-- Error Overlay -->
      <div v-if="hasError" class="video-overlay error">
        <q-icon name="error" size="48px" color="negative" />
        <p>Failed to load video</p>
      </div>

      <!-- Play Button Overlay -->
      <div
        v-if="!isPlaying && !isLoading && !hasError"
        class="video-overlay play-overlay"
        @click="play"
        role="button"
        aria-label="Play video"
        tabindex="0"
        @keydown.enter="play"
      >
        <q-icon name="play_circle_filled" size="80px" color="white" />
      </div>
    </div>

    <!-- Controls -->
    <div
      class="controls-panel"
      :class="{ visible: showControls || !isPlaying }"
      role="toolbar"
      aria-label="Video controls"
    >
      <!-- Progress Bar -->
      <div
        class="progress-bar"
        role="slider"
        :aria-valuenow="currentTime"
        aria-valuemin="0"
        :aria-valuemax="duration"
        aria-label="Video progress"
        tabindex="0"
        @click="handleProgressClick"
      >
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="controls-row">
        <!-- Left Controls -->
        <div class="controls-left">
          <q-btn
            flat
            dense
            round
            :icon="isPlaying ? 'pause' : 'play_arrow'"
            :aria-label="isPlaying ? 'Pause' : 'Play'"
            @click="togglePlay"
            color="white"
          />

          <span class="time-display">
            {{ formattedCurrentTime }} / {{ formattedDuration }}
          </span>
        </div>

        <!-- Right Controls -->
        <div class="controls-right">
          <!-- Quality Selector -->
          <q-btn-dropdown
            v-if="qualities.length > 0"
            flat
            dense
            color="white"
            :label="currentQuality >= 0 ? qualities[currentQuality]?.label : 'Auto'"
            aria-label="Select quality"
          >
            <q-list>
              <q-item
                clickable
                v-close-popup
                @click="changeQuality(-1)"
                :active="currentQuality === -1"
              >
                <q-item-section>Auto</q-item-section>
              </q-item>
              <q-item
                v-for="q in qualities"
                :key="q.index"
                clickable
                v-close-popup
                @click="changeQuality(q.index)"
                :active="currentQuality === q.index"
              >
                <q-item-section>{{ q.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Volume -->
          <div class="volume-control">
            <q-btn
              flat
              dense
              round
              :icon="isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'"
              :aria-label="isMuted ? 'Unmute' : 'Mute'"
              @click="toggleMute"
              color="white"
            />
            <q-slider
              :model-value="isMuted ? 0 : volume"
              :min="0"
              :max="1"
              :step="0.01"
              class="volume-slider"
              color="white"
              aria-label="Volume"
              @update:model-value="handleVolumeChange"
            />
          </div>

          <!-- PiP -->
          <q-btn
            flat
            dense
            round
            icon="picture_in_picture"
            aria-label="Picture in Picture"
            @click="togglePiP"
            color="white"
          />

          <!-- Fullscreen -->
          <q-btn
            flat
            dense
            round
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            @click="toggleFullscreen"
            color="white"
          />
        </div>
      </div>

      <!-- Features Legend -->
    </div>

    <!-- URL Input -->
    <div class="url-input-section q-pa-sm bg-grey-9">
      <q-input
        v-model="props.src"
        label="HLS Stream URL"
        dark
        outlined
        dense
        class="url-input"
        @keydown.enter="initHls"
      >
        <template #append>
          <q-btn
            flat
            dense
            label="Load"
            color="primary"
            size="sm"
            @click="initHls"
          />
        </template>
      </q-input>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hls-player {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  max-width: 800px;
}

.video-container {
  position: relative;
  width: 100%;
  background: #000;
}

.video-element {
  width: 100%;
  display: block;
  max-height: 450px;
  object-fit: contain;

  &:focus {
    outline: 2px solid #1e3a8a;
    outline-offset: -2px;
  }
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;

  &.error {
    background: rgba(0, 0, 0, 0.8);
    color: white;
  }

  &.play-overlay {
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.4);
    }
  }
}

.controls-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 32px 16px 16px;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.visible {
    opacity: 1;
  }
}

.progress-bar {
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 8px;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-display {
  color: white;
  font-size: 0.875rem;
  min-width: 100px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-slider {
  width: 80px;
}

.url-input-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.url-input {
  max-width: 100%;
}

/**
 * Responsive
 */
@media (max-width: 599px) {
  .video-element {
    max-height: 250px;
  }

  .volume-control {
    display: none;
  }

  .time-display {
    font-size: 0.75rem;
    min-width: 80px;
  }
}
</style>

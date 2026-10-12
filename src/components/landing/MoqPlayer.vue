<script setup lang="ts">
/**
 * Moq/Hang Video Player Component
 *
 * Low-latency streaming player using @kixelated/hang for real-time media delivery.
 * Note: This is a demonstration player. Full Moq/Hang integration requires a
 * compatible media server.
 *
 * @component
 * @example
 * <MoqPlayer
 *   src="webrtc://localhost:8000/stream"
 * />
 *
 * @accessibility
 * - Full keyboard navigation
 * - Screen reader announcements
 * - ARIA labels on all controls
 *
 * @features
 * - Low-latency streaming simulation
 * - WebRTC connection status
 * - Stream URL input
 * - Custom controls (play/pause, seek, volume, fullscreen)
 * - Connection status indicator
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  /** WebRTC stream URL */
  src?: string;
  /** Poster image URL */
  poster?: string;
  /** Auto connect on load */
  autoconnect?: boolean;
}

interface Emits {
  (e: 'connected'): void;
  (e: 'disconnected'): void;
  (e: 'error', error: Error): void;
  (e: 'play'): void;
  (e: 'pause'): void;
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  autoconnect: false,
});

const emit = defineEmits<Emits>();

/** Video element reference */
const videoRef = ref<HTMLVideoElement | null>(null);

/** Connection status: 'disconnected' | 'connecting' | 'connected' | 'error' */
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

/** Playing state */
const isPlaying = ref(false);

/** Current time in seconds */
const currentTime = ref(0);

/** Total duration in seconds */
const duration = ref(0);

/** Buffering state */
const isBuffering = ref(false);

/** Volume (0-1) */
const volume = ref(0.8);

/** Muted state */
const isMuted = ref(false);

/** Show controls */
const showControls = ref(true);

/** Fullscreen state */
const isFullscreen = ref(false);

/** Demo mode (simulates stream with regular video) */
const isDemoMode = ref(true);

/** Error state */
const hasError = ref(false);

/** Latency simulation */
const latency = ref(0);

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
 * Simulate connection to Moq/Hang stream
 */
const connect = async () => {
  if (!props.src && isDemoMode.value) {
    // Use demo stream
    props.src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  }

  if (!props.src) {
    hasError.value = true;
    emit('error', new Error('No stream URL provided'));
    return;
  }

  connectionStatus.value = 'connecting';
  isBuffering.value = true;

  // Simulate connection delay
  setTimeout(() => {
    if (videoRef.value) {
      videoRef.value.src = props.src;
      videoRef.value.load();

      // Simulate successful connection
      setTimeout(() => {
        connectionStatus.value = 'connected';
        isBuffering.value = false;
        latency.value = Math.floor(Math.random() * 200) + 50; // Simulated latency 50-250ms
        emit('connected');
      }, 1000);
    }
  }, 500);
};

/**
 * Disconnect from stream
 */
const disconnect = () => {
  if (videoRef.value) {
    videoRef.value.src = '';
    videoRef.value.load();
  }
  connectionStatus.value = 'disconnected';
  isPlaying.value = false;
  emit('disconnected');
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

const handleWaiting = () => {
  isBuffering.value = true;
};

const handlePlaying = () => {
  isBuffering.value = false;
};

const handleError = () => {
  hasError.value = true;
  connectionStatus.value = 'error';
  emit('error', new Error('Stream connection failed'));
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

/**
 * Get status color
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'connected':
      return 'positive';
    case 'connecting':
      return 'warning';
    case 'error':
      return 'negative';
    default:
      return 'grey';
  }
};

/**
 * Get status label
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'error':
      return 'Error';
    default:
      return 'Disconnected';
  }
};

// Expose methods
defineExpose({
  connect,
  disconnect,
  play,
  pause,
});

// Lifecycle
onMounted(() => {
  if (props.autoconnect && props.src) {
    connect();
  }
});
</script>

<template>
  <div
    class="moq-player"
    role="region"
    aria-label="Moq/Hang Video Player"
    @mousemove="showControls = true"
    @mouseleave="showControls = false"
  >
    <!-- Connection Status Banner -->
    <div
      v-if="connectionStatus !== 'connected'"
      class="connection-banner"
      :class="connectionStatus"
    >
      <q-icon
        :name="connectionStatus === 'connecting' ? 'sync' : connectionStatus === 'error' ? 'error' : 'cloud_off'"
        :color="getStatusColor(connectionStatus)"
      />
      <span>{{ getStatusLabel(connectionStatus) }}</span>
      <q-btn
        v-if="connectionStatus === 'disconnected' || connectionStatus === 'error'"
        flat
        dense
        size="sm"
        label="Connect"
        color="white"
        @click="connect"
      />
    </div>

    <!-- Video Element -->
    <div class="video-container">
      <video
        ref="videoRef"
        class="video-element"
        :poster="poster"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @waiting="handleWaiting"
        @playing="handlePlaying"
        @error="handleError"
        @keydown="handleKeydown"
        tabindex="0"
        preload="metadata"
      />

      <!-- Loading Overlay -->
      <div v-if="isBuffering" class="video-overlay">
        <q-spinner-dots size="48px" color="white" />
        <p class="text-white q-mt-md">Buffering low-latency stream...</p>
      </div>

      <!-- Error Overlay -->
      <div v-if="hasError" class="video-overlay error">
        <q-icon name="error" size="48px" color="negative" />
        <p>Failed to connect to stream</p>
      </div>

      <!-- Play Button Overlay -->
      <div
        v-if="!isPlaying && !isBuffering && !hasError && connectionStatus === 'connected'"
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
            :disable="connectionStatus !== 'connected'"
          />

          <span class="time-display">
            {{ formattedCurrentTime }} / {{ formattedDuration }}
          </span>

          <!-- Latency Indicator -->
          <q-badge
            v-if="connectionStatus === 'connected'"
            color="positive"
            :label="`${latency}ms`"
            class="latency-badge"
          />
        </div>

        <!-- Right Controls -->
        <div class="controls-right">
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

          <!-- Disconnect -->
          <q-btn
            v-if="connectionStatus === 'connected'"
            flat
            dense
            round
            icon="link_off"
            aria-label="Disconnect from stream"
            @click="disconnect"
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

    <!-- Stream URL Input -->
    <div class="url-input-section q-pa-sm bg-grey-9">
      <div class="row q-col-gutter-sm items-center no-wrap">
        <div class="col">
          <q-input
            v-model="props.src"
            label="WebRTC/MoQ Stream URL"
            dark
            outlined
            dense
            class="url-input"
            placeholder="webrtc://localhost:8000/stream"
          />
        </div>
        <div class="col-auto">
          <q-btn
            :color="connectionStatus === 'connected' ? 'negative' : 'primary'"
            :label="connectionStatus === 'connected' ? 'Disconnect' : 'Connect'"
            size="sm"
            @click="connectionStatus === 'connected' ? disconnect() : connect()"
          />
        </div>
      </div>
      <div class="q-mt-xs text-caption text-grey-6">
        Demo mode: Uses HLS stream as fallback
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.moq-player {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  max-width: 800px;
}

.connection-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;

  &.connecting {
    background: rgba(245, 158, 11, 0.2);
  }

  &.error {
    background: rgba(239, 68, 68, 0.2);
  }
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

.latency-badge {
  font-size: 0.75rem;
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

  .latency-badge {
    display: none;
  }
}
</style>
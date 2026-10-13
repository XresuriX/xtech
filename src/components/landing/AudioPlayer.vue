<script setup lang="ts">
/**
 * Audio Music Player Component
 *
 * A simple, accessible audio-only music player with playlist support.
 * Uses HTML5 audio element with custom controls.
 *
 * @component
 * @example
 * <AudioPlayer
 *   :playlist="playlist"
 *   :autoplay="false"
 *   @ended="handleEnded"
 * />
 *
 * @accessibility
 * - Full keyboard support (Play/Pause: Space, Next: ArrowRight, Prev: ArrowLeft)
 * - Screen reader announcements for track changes
 * - Uses semantic HTML audio element with controls
 * - ARIA labels on all interactive elements
 *
 * @features
 * - Play/Pause toggle
 * - Previous/Next track navigation
 * - Progress bar with seek functionality
 * - Volume control
 * - Track info display
 * - Shuffle and repeat modes
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface Track {
  /** Unique track identifier */
  id: string | number;
  /** Track title */
  title: string;
  /** Artist name */
  artist?: string;
  /** Audio file URL */
  src: string;
  /** Optional album art URL */
  cover?: string;
  /** Track duration in seconds (optional, can be auto-detected) */
  duration?: number;
}

interface Props {
  /** Array of tracks to play */
  playlist?: Track[];
  /** Whether to auto-play when track changes */
  autoplay?: boolean;
  /** Start with a specific track index */
  initialTrack?: number;
  /** Show album art */
  showCover?: boolean;
}

interface Emits {
  /** Track started playing */
  (e: 'play', track: Track, index: number): void;
  /** Track ended */
  (e: 'ended', track: Track, index: number): void;
  /** Track changed (by user navigation) */
  (e: 'change', track: Track, index: number): void;
  /** Volume changed */
  (e: 'volumeChange', volume: number): void;
  /** Error playing track */
  (e: 'error', error: Error, track: Track): void;
}

const props = withDefaults(defineProps<Props>(), {
  playlist: () => [],
  autoplay: false,
  initialTrack: 0,
  showCover: true,
});

const emit = defineEmits<Emits>();

/** Audio element reference */
const audioRef = ref<HTMLAudioElement | null>(null);

/** Current track index */
const currentIndex = ref(props.initialTrack);

/** Playing state */
const isPlaying = ref(false);

/** Current time in seconds */
const currentTime = ref(0);

/** Total duration in seconds */
const duration = ref(0);

/** Loading state */
const isLoading = ref(false);

/** Volume (0-1) */
const volume = ref(0.8);

/** Muted state */
const isMuted = ref(false);

/** Repeat mode: 'none' | 'all' | 'one' */
const repeatMode = ref<'none' | 'all' | 'one'>('none');

/** Shuffle mode */
const isShuffled = ref(false);

/** Error state */
const hasError = ref(false);

/** Show add track dialog */
const showAddTrack = ref(false);

/** New track URL input */
const newTrackUrl = ref('');

/** New track title input */
const newTrackTitle = ref('');

/** File input reference */
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * Add track from URL
 */
const addTrackFromUrl = () => {
  if (!newTrackUrl.value || !newTrackTitle.value) 
return;

  const newTrack: Track = {
    id: Date.now(),
    title: newTrackTitle.value,
    src: newTrackUrl.value,
  };

  // eslint-disable-next-line vue/no-mutating-props -- legacy demo player mutates prop in place
  props.playlist.push(newTrack);
  newTrackUrl.value = '';
  newTrackTitle.value = '';
  showAddTrack.value = false;
};

/**
 * Handle file selection
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files) 
return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = URL.createObjectURL(file);

    const newTrack: Track = {
      id: Date.now() + i,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local File',
      src: url,
    };

    // eslint-disable-next-line vue/no-mutating-props -- legacy demo player mutates prop in place
    props.playlist.push(newTrack);
  }

  target.value = '';
};

/**
 * Open file dialog
 */
const openFileDialog = () => {
  fileInputRef.value?.click();
};

/** Current track computed property */
const currentTrack = computed(() => {
  return props.playlist[currentIndex.value] || null;
});

/** Formatted current time */
const formattedCurrentTime = computed(() => formatTime(currentTime.value));

/** Formatted duration */
const formattedDuration = computed(() => formatTime(duration.value));

/** Progress percentage */
const progress = computed(() => {
  if (duration.value === 0) 
return 0;
  return (currentTime.value / duration.value) * 100;
});

/** Shuffle history for previous track */
const shuffleHistory = ref<number[]>([]);

/**
 * Format seconds to MM:SS
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Play the current track
 */
const play = async () => {
  if (!audioRef.value || !currentTrack.value) 
return;

  try {
    isLoading.value = true;
    hasError.value = false;
    await audioRef.value.play();
    isPlaying.value = true;
    emit('play', currentTrack.value, currentIndex.value);
  } catch (error) {
    hasError.value = true;
    emit('error', error as Error, currentTrack.value);
  } finally {
    isLoading.value = false;
  }
};

/**
 * Pause playback
 */
const pause = () => {
  if (!audioRef.value) 
return;
  audioRef.value.pause();
  isPlaying.value = false;
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
 * Play a specific track
 * @param index - Track index to play
 */
const playTrack = (index: number) => {
  if (index < 0 || index >= props.playlist.length) 
return;

  shuffleHistory.value.push(currentIndex.value);
  currentIndex.value = index;
  emit('change', props.playlist[index], index);

  if (props.autoplay || isPlaying.value) {
    play();
  }
};

/**
 * Play next track
 */
const next = () => {
  if (props.playlist.length === 0) 
return;

  if (isShuffled.value) {
    const nextIndex = Math.floor(Math.random() * props.playlist.length);
    playTrack(nextIndex);
  } else {
    const nextIndex = (currentIndex.value + 1) % props.playlist.length;
    playTrack(nextIndex);
  }
};

/**
 * Play previous track
 */
const prev = () => {
  if (props.playlist.length === 0) 
return;

  // If more than 3 seconds in, restart current track
  if (currentTime.value > 3) {
    seek(0);
    return;
  }

  if (shuffleHistory.value.length > 0) {
    const prevIndex = shuffleHistory.value.pop()!;
    currentIndex.value = prevIndex;
    emit('change', props.playlist[prevIndex], prevIndex);
    play();
  } else {
    const prevIndex = (currentIndex.value - 1 + props.playlist.length) % props.playlist.length;
    playTrack(prevIndex);
  }
};

/**
 * Seek to a specific time
 * @param time - Time in seconds
 */
const seek = (time: number) => {
  if (!audioRef.value) 
return;
  audioRef.value.currentTime = time;
};

/**
 * Handle progress bar click
 * @param event - Mouse event
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
  if (audioRef.value) {
    audioRef.value.muted = isMuted.value;
  }
};

/**
 * Handle volume change
 * @param newVolume - New volume value (0-1)
 */
const handleVolumeChange = (newVolume: number) => {
  volume.value = newVolume;
  if (audioRef.value) {
    audioRef.value.volume = newVolume;
    isMuted.value = newVolume === 0;
  }
  emit('volumeChange', newVolume);
};

/**
 * Toggle repeat mode
 */
const toggleRepeat = () => {
  const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
  const currentIndex = modes.indexOf(repeatMode.value);
  repeatMode.value = modes[(currentIndex + 1) % modes.length];
};

/**
 * Toggle shuffle mode
 */
const toggleShuffle = () => {
  isShuffled.value = !isShuffled.value;
};

/**
 * Handle audio metadata loaded
 */
const handleLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
};

/**
 * Handle audio time update
 */
const handleTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

/**
 * Handle audio ended
 */
const handleEnded = () => {
  emit('ended', currentTrack.value!, currentIndex.value);

  if (repeatMode.value === 'one') {
    seek(0);
    play();
  } else if (repeatMode.value === 'all' || currentIndex.value < props.playlist.length - 1) {
    next();
  } else {
    isPlaying.value = false;
  }
};

/**
 * Handle audio error
 */
const handleError = () => {
  hasError.value = true;
  if (currentTrack.value) {
    emit('error', new Error('Failed to load audio'), currentTrack.value);
  }
};

/**
 * Handle keyboard controls
 * @param event - Keyboard event
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!currentTrack.value) 
return;

  switch (event.key) {
    case ' ':
    case 'k':
      event.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      event.preventDefault();
      next();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      prev();
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
  }
};

// Watch for track changes
watch(currentIndex, () => {
  if (props.autoplay && currentTrack.value) {
    nextTick(() => play());
  }
});

// Expose methods for parent components
defineExpose({
  play,
  pause,
  next,
  prev,
  seek,
  togglePlay,
});

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    class="audio-player"
    role="region"
    aria-label="Audio music player"
  >
    <!-- Audio Element (Hidden) -->
    <audio
      ref="audioRef"
      :src="currentTrack?.src"
      preload="metadata"
      @loadedmetadata="handleLoadedMetadata"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
      @error="handleError"
    />

    <!-- Player Content -->
    <div class="player-container">
      <!-- Track Info -->
      <div class="track-info" v-if="currentTrack">
        <div class="track-cover" v-if="showCover">
          <img
            v-if="currentTrack.cover"
            :src="currentTrack.cover"
            :alt="`Album cover for ${currentTrack.title}`"
          />
          <q-icon v-else name="music_note" size="32px" color="grey-5" />
        </div>
        <div class="track-details">
          <div class="track-title" :aria-label="`Now playing: ${currentTrack.title}`">
            {{ currentTrack.title }}
          </div>
          <div class="track-artist text-grey-7" v-if="currentTrack.artist">
            {{ currentTrack.artist }}
          </div>
        </div>
      </div>

      <!-- Player Controls -->
      <div class="player-controls">
        <div class="control-buttons">
          <!-- Shuffle Button -->
          <q-btn
            flat
            round
            dense
            :color="isShuffled ? 'primary' : 'grey-7'"
            :aria-label="isShuffled ? 'Shuffle is on' : 'Shuffle is off'"
            :aria-pressed="isShuffled"
            @click="toggleShuffle"
          >
            <q-icon name="shuffle" />
          </q-btn>

          <!-- Previous Button -->
          <q-btn
            flat
            round
            dense
            icon="skip_previous"
            aria-label="Previous track"
            @click="prev"
          />

          <!-- Play/Pause Button -->
          <q-btn
            round
            unelevated
            color="primary"
            class="play-btn"
            :aria-label="isPlaying ? 'Pause' : 'Play'"
            @click="togglePlay"
            :loading="isLoading"
          >
            <q-icon :name="isPlaying ? 'pause' : 'play_arrow'" size="28px" />
          </q-btn>

          <!-- Next Button -->
          <q-btn
            flat
            round
            dense
            icon="skip_next"
            aria-label="Next track"
            @click="next"
          />

          <!-- Repeat Button -->
          <q-btn
            flat
            round
            dense
            :color="repeatMode !== 'none' ? 'primary' : 'grey-7'"
            :aria-label="`Repeat: ${repeatMode}`"
            :aria-pressed="repeatMode !== 'none'"
            @click="toggleRepeat"
          >
            <q-icon :name="repeatMode === 'one' ? 'repeat_one' : 'repeat'" />
          </q-btn>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <span class="time-display" aria-hidden="true">{{ formattedCurrentTime }}</span>
          <div
            class="progress-bar"
            role="slider"
            :aria-valuenow="currentTime"
            aria-valuemin="0"
            :aria-valuemax="duration"
            aria-label="Track progress"
            tabindex="0"
            @click="handleProgressClick"
          >
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${progress}%` }"
              />
              <div
                class="progress-thumb"
                :style="{ left: `${progress}%` }"
              />
            </div>
          </div>
          <span class="time-display" aria-hidden="true">{{ formattedDuration }}</span>
        </div>
      </div>

      <!-- Volume Control -->
      <div class="volume-control">
        <q-btn
          flat
          round
          dense
          :icon="isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'"
          :aria-label="isMuted ? 'Unmute' : 'Mute'"
          @click="toggleMute"
        />
        <q-slider
          :model-value="isMuted ? 0 : volume"
          :min="0"
          :max="1"
          :step="0.01"
          class="volume-slider"
          aria-label="Volume"
          @update:model-value="handleVolumeChange"
        />
      </div>

      <!-- Error Display -->
      <div v-if="hasError" class="error-message" role="alert">
        <q-icon name="error" color="negative" />
        <span>Failed to load audio</span>
      </div>
    </div>

    <!-- Hidden file input for local files -->
    <input
      ref="fileInputRef"
      type="file"
      accept="audio/*"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Add Track Button -->
    <div class="add-track-section q-pa-md">
      <q-btn
        flat
        dense
        icon="add"
        label="Add Track"
        color="primary"
        @click="showAddTrack = !showAddTrack"
        aria-label="Add new track"
      />
      <q-btn
        flat
        dense
        icon="folder_open"
        label="Add Local File"
        color="secondary"
        @click="openFileDialog"
        aria-label="Add local audio file"
      />
    </div>

    <!-- Add Track Dialog -->
    <q-dialog v-model="showAddTrack" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add Track from URL</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newTrackTitle"
            label="Track Title"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="newTrackUrl"
            label="Audio URL"
            outlined
            dense
            placeholder="https://example.com/audio.mp3"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Add"
            color="primary"
            :disable="!newTrackUrl || !newTrackTitle"
            @click="addTrackFromUrl"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Playlist (Optional) -->
    <div v-if="playlist.length > 0" class="playlist">
      <div class="playlist-header">
        <span class="text-subtitle2">Playlist</span>
        <span class="text-caption text-grey-7">{{ playlist.length }} tracks</span>
      </div>
      <q-list dense>
        <q-item
          v-for="(track, index) in playlist"
          :key="track.id"
          clickable
          :active="index === currentIndex"
          active-class="bg-grey-3"
          @click="playTrack(index)"
          :aria-current="index === currentIndex ? 'true' : 'false'"
        >
          <q-item-section avatar>
            <q-icon
              :name="index === currentIndex && isPlaying ? 'volume_up' : 'music_note'"
              :color="index === currentIndex ? 'primary' : 'grey-6'"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ track.title }}</q-item-label>
            <q-item-label caption v-if="track.artist">{{ track.artist }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.audio-player {
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  max-width: 500px;
}

.player-container {
  padding: 16px;
}

.track-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.track-cover {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.track-details {
  min-width: 0;
  flex: 1;
}

.track-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-controls {
  margin-bottom: 12px;
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.play-btn {
  width: 48px;
  height: 48px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-display {
  font-size: 0.75rem;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e3a8a, #f59e0b);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #1e3a8a;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;

  .progress-bar:hover & {
    opacity: 1;
  }
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  flex: 1;
  max-width: 100px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fee;
  border-radius: 4px;
  margin-top: 8px;
  font-size: 0.875rem;
  color: #c00;
}

.playlist {
  border-top: 1px solid #e0e0e0;
  max-height: 200px;
  overflow-y: auto;
}

.playlist-header {
  padding: 12px 16px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

/**
 * Responsive
 */
@media (max-width: 599px) {
  .audio-player {
    border-radius: 0;
  }

  .volume-control {
    display: none;
  }

  .progress-container {
    padding: 0 8px;
  }
}
</style>
<script setup lang="ts">
/**
 * Demo Page
 *
 * Demonstrates various media players including:
 * - Audio Music Player
 * - Moq/Hang Player (low-latency streaming)
 * - HLS.js Player (HTTP Live Streaming)
 *
 * @page
 * @accessibility
 * - Tab navigation with ARIA roles
 * - Proper keyboard navigation
 * - Screen reader announcements
 */

import { ref, computed } from 'vue';
import AudioPlayer from '@/components/landing/AudioPlayer.vue';
import HlsPlayer from '@/components/landing/HlsPlayer.vue';
import MoqPlayer from '@/components/landing/MoqPlayer.vue';

const activeTab = ref('audio');

/**
 * Sample playlist for audio player demo
 */
const audioPlaylist = [
  {
    id: 1,
    title: 'Chill Vibes',
    artist: 'XTech Audio',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 2,
    title: 'Electronic Dreams',
    artist: 'XTech Audio',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 3,
    title: 'Acoustic Sessions',
    artist: 'XTech Audio',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

const hlsBaseUrl = ref(
  process.env.APP_HLS_BASE_URL || 'https://xrcomms.xamaycatechnologies.cloud:8888'
);
const moqBaseUrl = ref(
  process.env.APP_MOQ_BASE_URL || 'https://relay.example.com/anon'
);

const hlsRoomName = ref('test');
const moqRoomName = ref('alice');

const hlsStreamUrl = computed(
  () => `${hlsBaseUrl.value}/${hlsRoomName.value}.m3u8`
);

const moqStreamUrl = computed(
  () => `${moqBaseUrl.value}?name=${moqRoomName.value}`
);

const audioStreamUrl = ref('');

/**
 * Handle audio player events
 */
const handleAudioPlay = (track: any, index: number) => {
  console.log('Audio Playing:', track.title, 'at index:', index);
};

const handleAudioEnded = (track: any, index: number) => {
  console.log('Audio Ended:', track.title, 'at index:', index);
};

const handleAudioError = (error: Error, track: any) => {
  console.error('Audio Error:', track.title, error);
};

const addStreamToPlaylist = () => {
  if (!audioStreamUrl.value) return;
  const url = audioStreamUrl.value;
  const name = url.split('/').pop() || 'Stream';
  audioPlaylist.push({
    id: Date.now(),
    title: name,
    artist: 'Internet Radio',
    src: url,
  });
  audioStreamUrl.value = '';
};

/**
 * Handle HLS player events
 */
const handleHlsLoaded = () => {
  console.log('HLS stream loaded');
};

const handleHlsError = (error: Error) => {
  console.error('HLS Error:', error);
};

/**
 * Handle Moq player events
 */
const handleMoqConnected = () => {
  console.log('Moq/Hang connected');
};

const handleMoqDisconnected = () => {
  console.log('Moq/Hang disconnected');
};

const handleMoqError = (error: Error) => {
  console.error('Moq/Hang Error:', error);
};
</script>

<template>
  <q-page
    class="demo-page q-pa-xl"
    role="region"
    aria-labelledby="demo-heading"
  >
    <header class="q-mb-lg">
      <h1 id="demo-heading" class="text-h4 text-weight-bold text-primary">
        Demo
      </h1>
      <p class="text-body1 text-grey-7">
        Explore our media player demonstrations and interactive features.
      </p>
    </header>

    <q-tabs
      v-model="activeTab"
      dense
      class="text-primary demo-tabs"
      active-color="secondary"
      indicator-color="secondary"
      align="left"
      role="tablist"
      aria-label="Demo categories"
    >
      <q-tab
        name="audio"
        icon="music_note"
        label="Audio Player"
        role="tab"
      />
      <q-tab
        name="hls"
        icon="play_circle"
        label="HLS Player"
        role="tab"
      />
      <q-tab
        name="moq"
        icon="live_tv"
        label="Moq/Hang"
        role="tab"
      />
    </q-tabs>

    <q-tab-panels
      v-model="activeTab"
      animated
      class="q-mt-md"
      role="tabpanel"
    >
      <!-- Audio Player Tab -->
      <q-tab-panel name="audio" role="tabpanel">
        <q-card class="q-pa-lg">
          <div class="text-h5 text-weight-bold q-mb-md">
            Audio Music Player
          </div>
          <div class="text-body2 text-grey-7 q-mb-lg">
            A fully accessible audio player with playlist support.
            Keyboard shortcuts: Space (play/pause), Arrow keys (seek/navigate), M (mute)
          </div>

          <!-- Audio Stream URL Input -->
          <div class="q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">Internet Radio / Stream URL</div>
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model="audioStreamUrl"
                outlined
                dense
                placeholder="https://example.com/stream.mp3"
                style="max-width: 400px"
              />
              <q-btn
                v-if="audioStreamUrl"
                flat
                dense
                icon="add"
                label="Add to Playlist"
                color="primary"
                @click="addStreamToPlaylist"
              />
            </div>
          </div>

          <!-- Audio Player Component -->
          <div class="q-mb-lg">
            <AudioPlayer
              :playlist="audioPlaylist"
              :autoplay="false"
              :initial-track="0"
              @play="handleAudioPlay"
              @ended="handleAudioEnded"
              @error="handleAudioError"
            />
          </div>

          <!-- Features List -->
          <q-list bordered separator class="rounded-borders">
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Full keyboard navigation</q-item-label>
                <q-item-label caption>Space, Arrow keys, M for mute</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Playlist support</q-item-label>
                <q-item-label caption>Add tracks from URL or local files</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Shuffle and repeat modes</q-item-label>
                <q-item-label caption>Customizable playback</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Full accessibility</q-item-label>
                <q-item-label caption>ARIA labels, screen reader support</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>

      <!-- HLS Player Tab -->
      <q-tab-panel name="hls" role="tabpanel">
        <q-card class="q-pa-lg">
          <div class="text-h5 text-weight-bold q-mb-md">
            HLS.js Player
          </div>
          <div class="text-body2 text-grey-7 q-mb-md">
            HTTP Live Streaming video player with adaptive bitrate.
            Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute)
          </div>

          <!-- URL Input -->
          <div class="q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">Stream URL</div>
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model="hlsBaseUrl"
                outlined
                dense
                readonly
                style="max-width: 280px"
                class="bg-grey-2"
              />
              <span class="text-body1">/</span>
              <q-input
                v-model="hlsRoomName"
                outlined
                dense
                style="max-width: 150px"
                placeholder="room name"
              />
              <span class="text-body1">.m3u8</span>
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              Full URL: {{ hlsStreamUrl }}
            </div>
          </div>

          <!-- HLS Player Component -->
          <div class="q-mb-lg">
            <HlsPlayer
              :src="hlsStreamUrl"
              autoplay
              @loaded="handleHlsLoaded"
              @error="handleHlsError"
            />
          </div>
          <div class="q-pb-"></div>

          <!-- Features List -->

        </q-card>
        <q-list bordered separator class="rounded-borders">
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Adaptive bitrate streaming</q-item-label>
                <q-item-label caption>Automatic quality adjustment</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Quality selection</q-item-label>
                <q-item-label caption>Manual quality override</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Picture-in-Picture</q-item-label>
                <q-item-label caption>Watch while browsing</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Full keyboard navigation</q-item-label>
                <q-item-label caption>Space, Arrow keys, F, M</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
      </q-tab-panel>

      <!-- Moq/Hang Player Tab -->
      <q-tab-panel name="moq" role="tabpanel">
        <q-card class="q-pa-lg">
          <div class="text-h5 text-weight-bold q-mb-md">
            Moq/Hang Player
          </div>
          <div class="text-body2 text-grey-7 q-mb-md">
            Low-latency streaming player using @kixelated/hang for real-time media delivery.
            Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute)
          </div>

          <!-- URL Input -->
          <div class="q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">Stream URL</div>
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model="moqBaseUrl"
                outlined
                dense
                readonly
                style="max-width: 280px"
                class="bg-grey-2"
              />
              <span class="text-body1">?name=</span>
              <q-input
                v-model="moqRoomName"
                outlined
                dense
                style="max-width: 150px"
                placeholder="room name"
              />
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              Full URL: {{ moqStreamUrl }}
            </div>
          </div>

          <!-- Moq/Hang Player Component -->
          <div class="q-mb-lg">
            <MoqPlayer
              :src="moqStreamUrl"
              :autoconnect="true"
              @connected="handleMoqConnected"
              @disconnected="handleMoqDisconnected"
              @error="handleMoqError"
            />
          </div>


        </q-card>
        <!-- Features List -->
          <q-list bordered separator class="rounded-borders">
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Low-latency streaming</q-item-label>
                <q-item-label caption>Real-time media delivery simulation</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Connection status</q-item-label>
                <q-item-label caption>Visual indicator for stream state</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Latency display</q-item-label>
                <q-item-label caption>Real-time latency monitoring</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Full keyboard navigation</q-item-label>
                <q-item-label caption>Space, Arrow keys, F, M</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<style lang="scss" scoped>
.demo-page {
  max-width: 1000px;
  margin: 0 auto;
}

.demo-tabs {
  background: #f5f5f5;
  border-radius: 8px;
}

/**
 * Responsive adjustments
 */
@media (max-width: 599px) {
  .demo-page {
    padding: 16px;
  }

  .demo-tabs {
    overflow-x: auto;
  }
}
</style>

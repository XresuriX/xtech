<script setup lang="ts">
/**
 * Blog Player Page
 *
 * Blog page with HLS and Moq video player integration.
 *
 * @page
 */

import { ref, computed } from 'vue';
import { useMeta } from 'quasar';
import HlsPlayer from '@/components/landing/HlsPlayer.vue';
import MoqPlayer from '@/components/landing/MoqPlayer.vue';

useMeta({
  title: 'Blog - Media Player',
  meta: {
    description: 'Blog with video streaming players.',
  },
});

const activePlayer = ref<'hls' | 'moq'>('hls');

const hlsBaseUrl = ref('https://xrcomms.xamaycatechnologies.cloud:8888');
const moqBaseUrl = ref('https://relay.example.com/anon');

const hlsRoomName = ref('test');
const moqRoomName = ref('alice');

const hlsStreamUrl = computed(() => `${hlsBaseUrl.value}/${hlsRoomName.value}.m3u8`);
const moqStreamUrl = computed(() => `${moqBaseUrl.value}?name=${moqRoomName.value}`);
</script>

<template>
  <q-page class="blog-player-page q-pa-xl">
    <header class="q-mb-lg">
      <h1 class="text-h4 text-weight-bold text-primary">
        Blog - Media Players
      </h1>
      <p class="text-body1 text-grey-7">
        Blog post with integrated HLS and Moq/Hang video streaming players.
      </p>
    </header>

    <div class="blog-content">
      <q-card class="q-pa-lg q-mb-lg">
        <h2 class="text-h5 q-mb-md">Video Streaming</h2>
        <p class="text-body1 text-grey-7 q-mb-md">
          This blog post demonstrates the integration of video streaming players.
          Use the tabs below to switch between HLS and Moq/Hang streaming protocols.
        </p>

        <q-tabs
          v-model="activePlayer"
          dense
          class="text-primary"
          active-color="secondary"
          indicator-color="secondary"
          align="left"
          q-mb-md
        >
          <q-tab name="hls" label="HLS Player" icon="play_circle" />
          <q-tab name="moq" label="Moq/Hang Player" icon="live_tv" />
        </q-tabs>

        <q-tab-panels v-model="activePlayer" animated>
          <q-tab-panel name="hls">
            <div class="q-mb-md">
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
            </div>
            <HlsPlayer :src="hlsStreamUrl" :autoplay="false" />
          </q-tab-panel>

          <q-tab-panel name="moq">
            <div class="q-mb-md">
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
            </div>
            <MoqPlayer :src="moqStreamUrl" :autoconnect="false" />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.blog-player-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
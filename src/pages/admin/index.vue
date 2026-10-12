<script setup lang="ts">
/**
 * Admin Dashboard Page
 *
 * Unprotected admin dashboard with analytics and media publishing capabilities.
 */

import { ref, computed } from 'vue';
import { useMeta } from 'quasar';
import { biCode, biMusicNote } from '@quasar/extras/bootstrap-icons';
import BaseButton from 'src/components/base/BaseButton.vue';
import BaseCard from 'src/components/base/BaseCard.vue';
import BaseTabs from 'src/components/base/BaseTabs.vue';
import ChartArea from 'src/components/chart/ChartArea.vue';
import ChartSparklines from 'src/components/chart/ChartSparklines.vue';
import {
  dashBaordRecentSalseItems,
  dashBaordStatisticItems,
  dashboardChartData,
  dashboardHeroItems,
  dashboardSparkLineItems,
} from 'src/libs/data';
import type { LabelValue } from 'src/types/common';

useMeta({
  title: 'Admin Dashboard',
});

const activeTab = ref<'overview' | 'analytics' | 'reports' | 'publish'>('overview');

const publishType = ref<'audio' | 'video' | 'both'>('video');
const streamUrl = ref('');
const streamName = ref('');
const isPublishing = ref(false);
const publishStatus = ref<'idle' | 'connecting' | 'publishing' | 'live' | 'error'>('idle');

const publishUrl = computed(() => {
  if (!streamUrl.value) return '';
  const base = streamUrl.value.endsWith('/') ? streamUrl.value : streamUrl.value + '/';
  return `${base}${streamName.value || 'stream'}`;
});

const startPublish = () => {
  if (!streamUrl.value || !streamName.value) return;
  isPublishing.value = true;
  publishStatus.value = 'connecting';
  
  setTimeout(() => {
    publishStatus.value = 'publishing';
    setTimeout(() => {
      publishStatus.value = 'live';
      isPublishing.value = false;
    }, 1500);
  }, 1000);
};

const stopPublish = () => {
  publishStatus.value = 'idle';
  isPublishing.value = false;
};

const testAudioStream = () => {
  streamUrl.value = 'https://xrcomms.xamaycatechnologies.cloud:8888';
  streamName.value = 'audio-test';
  publishType.value = 'audio';
};

const testVideoStream = () => {
  streamUrl.value = 'https://xrcomms.xamaycatechnologies.cloud:8888';
  streamName.value = 'video-test';
  publishType.value = 'video';
};

const testBothStream = () => {
  streamUrl.value = 'https://xrcomms.xamaycatechnologies.cloud:8888';
  streamName.value = 'av-test';
  publishType.value = 'both';
};
</script>

<template>
  <div class="admin-dashboard">
    <BaseCard
      title="Admin Dashboard"
      :bordered="false"
      flat
      subtitle="System overview and media publishing controls."
      :icon="biMusicNote"
    >
      <template #end>
        <q-item-section side>
          <BaseButton
            href="https://github.com/bekaku/quasar-starter-template/blob/main/src/pages/index.vue"
            target="_blank"
            :icon="biCode"
            flat
            round
          />
        </q-item-section>
      </template>

      <q-card-section>
        <BaseTabs
          v-model="activeTab"
          :full-width="false"
          :items="[
            { label: 'Overview', value: 'overview' },
            { label: 'Analytics', value: 'analytics' },
            { label: 'Reports', value: 'reports' },
            { label: 'Publish', value: 'publish' },
          ]"
          align="left"
        />
      </q-card-section>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'">
        <div class="row">
          <div
            v-for="(item, index) in dashboardHeroItems"
            :key="index"
            class="col-12 col-sm-6 col-md-4 q-pa-sm"
          >
            <q-card class="my-card" flat bordered>
              <q-card-section>
                <div class="text-overline text-orange">{{ item.label }}</div>
                <div class="text-h5 q-mt-none q-mb-xs text-weight-bold">
                  {{ item.value }}
                </div>
                <div class="text-caption text-grey">
                  {{ item.description }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-md">
          <div
            v-for="(item, index) in dashboardSparkLineItems"
            :key="index"
            class="col-12 col-md-4"
          >
            <ChartSparklines
              :series="item.series"
              :categories="item.categories"
              :color="item.color"
              :height="80"
            />
          </div>
        </div>

        <div class="q-mt-lg">
          <q-table
            flat
            bordered
            title="Recent Activity"
            :rows="dashBaordRecentSalseItems"
            :columns="[
              { name: 'label', label: 'Activity', field: 'label', align: 'left' },
              { name: 'value', label: 'Value', field: 'value', align: 'left' },
            ]"
            row-key="label"
          />
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'">
        <ChartArea
          :series="dashboardChartData.series.slice(0, 3)"
          :categories="dashboardChartData.categories"
          :height="350"
        />
      </div>

      <!-- Reports Tab -->
      <div v-if="activeTab === 'reports'">
        <q-card flat bordered class="q-pa-md">
          <div class="text-h6 q-mb-md">Reports</div>
          <q-list bordered separator>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="description" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>System Report</q-item-label>
                <q-item-label class="text-caption">Generated: May 16, 2026</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="download" color="primary" />
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="assessment" color="secondary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Traffic Report</q-item-label>
                <q-item-label class="text-caption">Generated: May 16, 2026</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="download" color="secondary" />
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="analytics" color="accent" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Performance Report</q-item-label>
                <q-item-label class="text-caption">Generated: May 16, 2026</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="download" color="accent" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Publish Tab -->
      <div v-if="activeTab === 'publish'">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-h6 q-mb-md">Stream Publishing</div>
              <div class="text-body2 text-grey-7 q-mb-md">
                Configure and start publishing media streams to your media server.
              </div>

              <q-btn-toggle
                v-model="publishType"
                toggle-color="primary"
                :options="[
                  { label: 'Audio Only', value: 'audio', icon: 'headphones' },
                  { label: 'Video Only', value: 'video', icon: 'videocam' },
                  { label: 'Audio + Video', value: 'both', icon: 'dual' },
                ]"
                class="q-mb-md"
              />

              <q-input
                v-model="streamUrl"
                label="Media Server URL"
                outlined
                dense
                class="q-mb-md"
                placeholder="https://xrcomms.xamaycatechnologies.cloud:8888"
              >
                <template #prepend>
                  <q-icon name="cloud" />
                </template>
              </q-input>

              <q-input
                v-model="streamName"
                label="Stream Name / Room"
                outlined
                dense
                class="q-mb-md"
                placeholder="my-stream"
              >
                <template #prepend>
                  <q-icon name="live_tv" />
                </template>
              </q-input>

              <div class="text-caption text-grey-7 q-mb-md">
                <strong>Publish URL:</strong> {{ publishUrl || 'Enter server URL and stream name' }}
              </div>

              <div class="q-mb-md">
                <q-banner class="bg-grey-2" rounded>
                  <template #avatar>
                    <q-icon
                      name="info"
                      color="grey-7"
                    />
                  </template>
                  <span class="text-weight-medium">
                    Status:
                    {{
                      publishStatus === 'idle'
                        ? 'Ready'
                        : publishStatus === 'connecting'
                        ? 'Connecting...'
                        : publishStatus === 'publishing'
                        ? 'Publishing...'
                        : publishStatus === 'live'
                        ? 'Live'
                        : 'Error'
                    }}
                  </span>
                </q-banner>
              </div>

              <div class="row q-gutter-sm">
                <q-btn
                  v-if="publishStatus === 'idle' || publishStatus === 'error'"
                  color="primary"
                  label="Start Publishing"
                  icon="play_arrow"
                  :disable="!streamUrl || !streamName"
                  @click="startPublish"
                />
                <q-btn
                  v-else
                  color="negative"
                  label="Stop Publishing"
                  icon="stop"
                  @click="stopPublish"
                />
                <q-btn
                  flat
                  label="Test URLs"
                  icon="science"
                  @click="testVideoStream"
                />
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-h6 q-mb-md">Quick Test Streams</div>
              <div class="text-body2 text-grey-7 q-mb-md">
                Click to auto-fill test stream configurations for your media server.
              </div>

              <q-list>
                <q-item clickable @click="testAudioStream">
                  <q-item-section avatar>
                    <q-icon name="headphones" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Audio Stream Test</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" />
                  </q-item-section>
                </q-item>

                <q-item clickable @click="testVideoStream">
                  <q-item-section avatar>
                    <q-icon name="videocam" color="secondary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Video Stream Test</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" />
                  </q-item-section>
                </q-item>

                <q-item clickable @click="testBothStream">
                  <q-item-section avatar>
                    <q-icon name="dual" color="accent" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Audio + Video Stream</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" />
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator class="q-my-md" />

              <div class="text-subtitle2 q-mb-sm">Server Configuration</div>
              <q-input
                v-model="streamUrl"
                label="RTSP/RTMP Server"
                outlined
                dense
                class="q-mb-sm"
                placeholder="rtsp://localhost:8554"
              >
                <template #prepend>
                  <q-icon name="settings_ethernet" />
                </template>
              </q-input>
              <q-input
                v-model="streamUrl"
                label="HLS Output URL"
                outlined
                dense
                placeholder="https://your-server.com:8888"
              >
                <template #prepend>
                  <q-icon name="http" />
                </template>
              </q-input>
            </q-card>

            <q-card flat bordered class="q-pa-md q-mt-md">
              <div class="text-h6 q-mb-md">Publishing Help</div>
              <div class="text-body2 text-grey-7">
                <p class="q-mb-sm">
                  <strong>To publish a stream, you can use FFmpeg:</strong>
                </p>
                <q-card flat class="bg-grey-1 q-pa-sm">
                  <code style="font-size: 0.75rem">
                    ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f rtsp rtsp://server:8554/stream
                  </code>
                </q-card>
                <p class="q-mt-sm q-mb-xs">
                  <strong>Or for RTMP:</strong>
                </p>
                <q-card flat class="bg-grey-1 q-pa-sm">
                  <code style="font-size: 0.75rem">
                    ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f flv rtmp://server:1935/live/stream
                  </code>
                </q-card>
              </div>
            </q-card>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style lang="scss" scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}
</style>
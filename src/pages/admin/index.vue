<script setup lang="ts">
/**
 * Admin Dashboard Page
 *
 * Demo overview tabs + real catalogue publishing (xt-plat /api/v1/catalogue).
 */

import { computed, onMounted, ref } from 'vue';
import { date, useMeta } from 'quasar';
import { biCode, biMusicNote } from '@quasar/extras/bootstrap-icons';
import ActivityService from 'src/api/ActivityService';
import type { ActivityOut } from 'src/api/ActivityService';
import CatalogueService from 'src/api/CatalogueService';
import type { StreamCreateOut, SyncTokenOut, TelemetryOut } from 'src/api/CatalogueService';
import { useBase } from 'src/composables/useBase';
import BaseButton from 'src/components/base/BaseButton.vue';
import BaseCard from 'src/components/base/BaseCard.vue';
import BaseTabs from 'src/components/base/BaseTabs.vue';
import ChartArea from 'src/components/chart/ChartArea.vue';
import ChartSparklines from 'src/components/chart/ChartSparklines.vue';
import {
  dashBaordRecentSalseItems,
  dashboardChartData,
  dashboardHeroItems,
  dashboardSparkLineItems,
} from 'src/libs/data';

useMeta({
  title: 'Admin Dashboard',
});

const { appConfirm, appLoading } = useBase();
const catalogue = CatalogueService();
const activityApi = ActivityService();

const activeTab = ref<'overview' | 'analytics' | 'reports' | 'publish'>('overview');

// --- real catalogue state ---
const streams = ref<StreamCreateOut[]>([]);
const streamsLoading = ref(false);
const activities = ref<ActivityOut[]>([]);
const createForm = ref({ title: '', description: '', enable_recording: true });
const creating = ref(false);
const dialogSync = ref(false);
const syncTokenData = ref<SyncTokenOut | null>(null);
const dialogTelemetry = ref(false);
const telemetryData = ref<TelemetryOut | null>(null);
const telemetryLoading = ref(false);

const loadStreams = async (): Promise<void> => {
  streamsLoading.value = true;
  const res = await catalogue.list({ limit: 50 });
  streams.value = res ?? [];
  streamsLoading.value = false;
};

const loadActivities = async (): Promise<void> => {
  const res = await activityApi.list({ limit: 10 });
  activities.value = res ?? [];
};

const activityRows = computed(() =>
  activities.value.length > 0
    ? activities.value.map((item) => ({
        label: item.description || `${item.verb} (${item.actor_display})`,
        value: date.formatDate(item.emitted_at, 'YYYY-MM-DD HH:mm'),
      }))
    : dashBaordRecentSalseItems
);

const onCreateStream = async (): Promise<void> => {
  if (!createForm.value.title) 
return;
  creating.value = true;
  appLoading(true);
  const res = await catalogue.create({
    title: createForm.value.title,
    description: createForm.value.description,
    enable_recording: createForm.value.enable_recording,
  });
  appLoading(false);
  creating.value = false;
  if (res) {
    createForm.value = { title: '', description: '', enable_recording: true };
    await loadStreams();
  }
};

const hlsUrl = (stream: StreamCreateOut): string =>
  stream.playback?.hls_url || stream.playback_url || '';

const onDeleteStream = async (stream: StreamCreateOut): Promise<void> => {
  const conf = await appConfirm('Delete stream', `Delete "${stream.title}"?`);
  if (!conf) 
return;
  appLoading(true);
  await catalogue.remove(stream.id);
  appLoading(false);
  await loadStreams();
};

const onSyncToken = async (stream: StreamCreateOut): Promise<void> => {
  appLoading(true);
  syncTokenData.value = await catalogue.syncToken(stream.id);
  appLoading(false);
  dialogSync.value = syncTokenData.value != null;
};

const onTelemetry = async (stream: StreamCreateOut): Promise<void> => {
  telemetryData.value = null;
  dialogTelemetry.value = true;
  telemetryLoading.value = true;
  telemetryData.value = await catalogue.telemetry(stream.id);
  telemetryLoading.value = false;
};

onMounted(() => {
  void loadStreams();
  void loadActivities();
});
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
            :rows="activityRows"
            :columns="[
              { name: 'label', label: 'Activity', field: 'label', align: 'left' },
              { name: 'value', label: 'When', field: 'value', align: 'left' },
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

      <!-- Publish Tab: real catalogue API -->
      <div v-if="activeTab === 'publish'">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-h6 q-mb-md">Create stream</div>
              <div class="text-body2 text-grey-7 q-mb-md">
                Provisions a stream on the media server (POST /catalogue/streams).
              </div>

              <q-input
                v-model="createForm.title"
                label="Title"
                outlined
                dense
                class="q-mb-md"
                placeholder="My live stream"
              />
              <q-input
                v-model="createForm.description"
                label="Description"
                type="textarea"
                outlined
                dense
                class="q-mb-md"
              />
              <q-toggle
                v-model="createForm.enable_recording"
                label="Enable recording (DVR)"
                class="q-mb-md"
              />

              <q-btn
                color="primary"
                label="Create stream"
                icon="add"
                :loading="creating"
                :disable="!createForm.title"
                @click="onCreateStream"
              />

              <q-separator class="q-my-md" />
              <div class="text-subtitle2 q-mb-sm">Publishing Help</div>
              <div class="text-body2 text-grey-7">
                <p class="q-mb-sm">
                  <strong>FFmpeg (RTMP):</strong>
                </p>
                <q-card flat class="bg-grey-1 q-pa-sm">
                  <code style="font-size: 0.75rem">
                    ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f flv rtmp://&lt;media-host&gt;/live/&lt;stream-key&gt;
                  </code>
                </q-card>
                <p class="q-mt-sm q-mb-xs">
                  <strong>FFmpeg (RTSP ingest URL shown per stream below):</strong>
                </p>
                <q-card flat class="bg-grey-1 q-pa-sm">
                  <code style="font-size: 0.75rem">
                    ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f rtsp &lt;ingest_url&gt;
                  </code>
                </q-card>
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-8">
            <q-card flat bordered class="q-pa-md">
              <div class="text-h6 q-mb-md">Streams</div>
              <q-table
                flat
                :rows="streams"
                :loading="streamsLoading"
                row-key="id"
                :columns="[
                  { name: 'title', label: 'Title', field: 'title', align: 'left' },
                  { name: 'status', label: 'Status', field: 'status', align: 'left' },
                  { name: 'playback', label: 'HLS', field: 'playback_url', align: 'left' },
                  { name: 'actions', label: '', field: 'id', align: 'center' },
                ]"
                :rows-per-page-options="[0]"
                hide-pagination
              >
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge :color="props.row.status === 'live' ? 'positive' : 'grey-6'">
                      {{ props.row.status }}
                    </q-badge>
                  </q-td>
                </template>
                <template #body-cell-playback="props">
                  <q-td :props="props">
                    <a
                      v-if="hlsUrl(props.row)"
                      :href="hlsUrl(props.row)"
                      target="_blank"
                      class="text-primary"
                      style="font-size: 0.8rem"
                    >
                      {{ hlsUrl(props.row).slice(0, 42) }}…
                    </a>
                    <span v-else class="text-grey-5">—</span>
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props" class="text-center" style="white-space: nowrap">
                    <q-btn flat dense size="sm" color="primary" icon="vpn_key" title="Sync token" @click="onSyncToken(props.row)" />
                    <q-btn flat dense size="sm" color="secondary" icon="monitor_heart" title="Telemetry" @click="onTelemetry(props.row)" />
                    <q-btn flat dense size="sm" color="negative" icon="delete" title="Delete" @click="onDeleteStream(props.row)" />
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </div>
        </div>

        <!-- Sync token dialog -->
        <q-dialog v-model="dialogSync">
          <q-card style="min-width: 480px">
            <q-card-section class="text-h6">Playback / sync token</q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-input :model-value="syncTokenData?.token" readonly outlined dense label="token" />
              <q-input :model-value="syncTokenData?.sync_token" readonly outlined dense label="sync_token" />
              <q-input :model-value="syncTokenData?.ws_sync_url" readonly outlined dense label="ws_sync_url" />
              <div class="text-caption text-grey-7">
                scope: {{ syncTokenData?.scope_type }}/{{ syncTokenData?.scope_id }} ·
                role: {{ syncTokenData?.role }} · expires in {{ syncTokenData?.expires_in }}s
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <BaseButton flat label="Close" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Telemetry dialog -->
        <q-dialog v-model="dialogTelemetry">
          <q-card style="min-width: 360px">
            <q-card-section class="text-h6">Stream telemetry</q-card-section>
            <q-card-section>
              <div v-if="telemetryLoading" class="text-grey-6">Loading…</div>
              <q-list v-else-if="telemetryData" bordered separator>
                <q-item>
                  <q-item-section avatar><q-icon :name="telemetryData.live ? 'live_tv' : 'stop_circle'" :color="telemetryData.live ? 'positive' : 'grey'" /></q-item-section>
                  <q-item-section><q-item-label>{{ telemetryData.live ? 'Live' : 'Offline' }}</q-item-label></q-item-section>
                </q-item>
                <q-item><q-item-section>Publishers</q-item-section><q-item-section side>{{ telemetryData.publishers }}</q-item-section></q-item>
                <q-item><q-item-section>Readers</q-item-section><q-item-section side>{{ telemetryData.readers }}</q-item-section></q-item>
                <q-item><q-item-section>Bytes in</q-item-section><q-item-section side>{{ telemetryData.bytes_in }}</q-item-section></q-item>
                <q-item><q-item-section>Bytes out</q-item-section><q-item-section side>{{ telemetryData.bytes_out }}</q-item-section></q-item>
              </q-list>
              <div v-else class="text-grey-6">No telemetry (stream not provisioned or STREAMING feature off).</div>
            </q-card-section>
            <q-card-actions align="right">
              <BaseButton flat label="Close" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>
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

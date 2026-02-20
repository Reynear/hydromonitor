<template>
  <VContainer fluid class="bg-surface live-view" align="center">
    <VRow class="w-100 live-row">
      <VCol cols="9">
        <figure class="highcharts-figure">
          <div id="container"></div>
        </figure>
      </VCol>

      <VCol cols="3">
        <VCard class="mb-5" max-width="500" color="primaryContainer" subtitle="Temperature">
          <VCardItem>
            <span class="text-h3 text-onPrimaryContainer">{{ temperature }}</span>
          </VCardItem>
        </VCard>

        <VCard class="mb-5" max-width="500" color="tertiaryContainer" subtitle="Heat Index (Feels like)">
          <VCardItem>
            <span class="text-h3 text-onTertiaryContainer">{{ heatindex }}</span>
          </VCardItem>
        </VCard>

        <VCard class="mb-5" max-width="500" color="secondaryContainer" subtitle="Humidity">
          <VCardItem>
            <span class="text-h3 text-onSecondaryContainer">{{ humidity }}</span>
          </VCardItem>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="w-100 live-row" justify="start">
      <VCol cols="9">
        <figure class="highcharts-figure">
          <div id="container1"></div>
        </figure>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import Highcharts from "highcharts";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useMqttStore } from "@/store/mqttStore";

const Mqtt = useMqttStore();
const { payload } = storeToRefs(Mqtt);
const temperatureChart = ref(null);
const humidityChart = ref(null);
let subscribeTimeoutId;

const temperature = computed(() => {
  if (!!payload.value) {
    return `${payload.value.temperature.toFixed(2)} °C`;
  }
});

const heatindex = computed(() => {
  if (!!payload.value) {
    return `${payload.value.heatindex.toFixed(2)} °C`;
  }
});

const humidity = computed(() => {
  if (!!payload.value) {
    return `${payload.value.humidity.toFixed(2)} %`;
  }
});

const updateCharts = (row) => {
  const ts = Number(row.timestamp);
  if (!Number.isFinite(ts)) return;

  const x = ts * 1000;
  const t = Number(row.temperature);
  const hi = Number(row.heatindex);
  const h = Number(row.humidity);

  if (temperatureChart.value) {
    if (Number.isFinite(t)) {
      temperatureChart.value.series[0].addPoint([x, t], true, temperatureChart.value.series[0].data.length > 90);
    }
    if (Number.isFinite(hi)) {
      temperatureChart.value.series[1].addPoint([x, hi], true, temperatureChart.value.series[1].data.length > 90);
    }
  }

  if (humidityChart.value && Number.isFinite(h)) {
    humidityChart.value.series[0].addPoint([x, h], true, humidityChart.value.series[0].data.length > 90);
  }
};

onMounted(() => {
  temperatureChart.value = Highcharts.chart("container", {
    chart: { type: "spline", zoomType: "x" },
    title: { text: "Temperature Analysis (Live)", align: "left" },
    xAxis: { type: "datetime", title: { text: "Time" } },
    yAxis: { title: { text: "Temperature" }, labels: { format: "{value} °C" } },
    tooltip: { shared: true },
    series: [
      { name: "Temperature", data: [] },
      { name: "Heat Index", data: [] },
    ],
    credits: { enabled: false },
  });

  humidityChart.value = Highcharts.chart("container1", {
    chart: { type: "spline", zoomType: "x" },
    title: { text: "Humidity Analysis (Live)", align: "left" },
    xAxis: { type: "datetime", title: { text: "Time" } },
    yAxis: { title: { text: "Humidity" }, labels: { format: "{value} %" } },
    tooltip: { shared: true },
    series: [{ name: "Humidity", data: [] }],
    credits: { enabled: false },
  });

  Mqtt.connect();
  subscribeTimeoutId = setTimeout(() => {
    Mqtt.subscribe("620171008");
  }, 3000);
});

onBeforeUnmount(() => {
  clearTimeout(subscribeTimeoutId);
  try {
    Mqtt.unsubscribeAll();
  } catch (error) {
    console.log(`MQTT: unsubscribeAll failed: ${error}`);
  }
});

watch(payload, (row) => {
  if (!row || typeof row !== "object") return;
  if (!("timestamp" in row) || !("temperature" in row) || !("humidity" in row)) return;
  updateCharts(row);
});
</script>

<style scoped>
.live-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.live-row {
  max-width: 1200px;
}

.highcharts-figure {
  width: 100%;
  margin: 0;
}

#container,
#container1 {
  width: 100%;
  min-height: 320px;
}
</style>

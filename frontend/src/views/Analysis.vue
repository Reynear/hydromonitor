<template>
  <VContainer fluid class="bg-surface analysis-view">
    <VRow class="w-100 analysis-row pa-1">
      <VCol>
        <VSheet class="pa-2" height="250">
          <p>Enter date range for Analysis</p>
          <VDivider class="mb-4" />

          <VTextField
            v-model="start"
            label="Start date"
            type="date"
            density="compact"
            variant="solo-inverted"
            class="mr-5"
            style="max-width: 300px"
            flat
          />

          <VTextField
            v-model="end"
            label="End date"
            type="date"
            density="compact"
            variant="solo-inverted"
            style="max-width: 300px"
            flat
          />

          <VSpacer />
          <VBtn class="text-caption" text="Analyze" color="primary" variant="tonal" @click="updateCards(); updateLineCharts(); updateHistogramCharts(); updateScatterCharts()" />
        </VSheet>
      </VCol>

      <VCol cols="3" align="center">
        <VCard title="Temperature" width="250" variant="outlined" color="primary" density="compact" rounded="lg">
          <VCardItem class="mb-n5">
            <VChipGroup class="d-flex flex-row justify-center" color="primaryContainer" variant="flat">
              <VTooltip text="Min" location="start">
                <template #activator="{ props }">
                  <VChip v-bind="props">{{ temperature.min }}</VChip>
                </template>
              </VTooltip>

              <VTooltip text="Range" location="top">
                <template #activator="{ props }">
                  <VChip v-bind="props">{{ temperature.range }}</VChip>
                </template>
              </VTooltip>

              <VTooltip text="Max" location="end">
                <template #activator="{ props }">
                  <VChip v-bind="props">{{ temperature.max }}</VChip>
                </template>
              </VTooltip>
            </VChipGroup>
          </VCardItem>

          <VCardItem align="center">
            <span class="text-h1 text-primary font-weight-bold">{{ temperature.avg }}</span>
          </VCardItem>
        </VCard>
      </VCol>

      <VCol cols="3" align="center">
        <VCard title="Humidity" width="250" variant="outlined" color="secondary" density="compact" rounded="lg">
          <VCardItem class="mb-n5">
            <VChipGroup class="d-flex flex-row justify-center" color="secondaryContainer" variant="flat">
              <VTooltip text="Min" location="start">
                <template #activator="{ props }">
                  <VChip v-bind="props">{{ humidity.min }}</VChip>
                </template>
              </VTooltip>

              <VTooltip text="Range" location="top">
                <template #activator="{ props }">
                  <VChip v-bind="props">{{ humidity.range }}</VChip>
                </template>
              </VTooltip>

              <VTooltip text="Max" location="end">
                <template #activator="{ props }">
                  <VChip v-bind="props">{{ humidity.max }}</VChip>
                </template>
              </VTooltip>
            </VChipGroup>
          </VCardItem>

          <VCardItem align="center">
            <span class="text-h1 text-secondary font-weight-bold">{{ humidity.avg }}</span>
          </VCardItem>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="w-100 analysis-row">
      <VCol cols="12">
        <figure class="highcharts-figure">
          <div id="container"></div>
        </figure>
      </VCol>
      <VCol cols="12">
        <figure class="highcharts-figure">
          <div id="container0"></div>
        </figure>
      </VCol>
    </VRow>

    <VRow class="w-100 analysis-row">
      <VCol cols="12" border>
        <figure class="highcharts-figure">
          <div id="container1"></div>
        </figure>
      </VCol>
      <VCol cols="12">
        <figure class="highcharts-figure">
          <div id="container2"></div>
        </figure>
      </VCol>
      <VCol cols="12">
        <figure class="highcharts-figure">
          <div id="container3"></div>
        </figure>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import Highcharts from "highcharts";
import { reactive, ref, onMounted } from "vue";
import { useAppStore } from "@/store/appStore";

const AppStore = useAppStore();
const start = ref("");
const end = ref("");

const temperature = reactive({ min: 0, max: 0, avg: 0, range: 0 });
const humidity = reactive({ min: 0, max: 0, avg: 0, range: 0 });

const lineChart = ref(null);
const humidityLineChart = ref(null);
const histogramChart = ref(null);
const tempHeatScatterChart = ref(null);
const humidHeatScatterChart = ref(null);

const getRange = () => {
  if (!start.value || !end.value) return null;
  const startDate = Math.floor(new Date(`${start.value}T00:00:00`).getTime() / 1000);
  const endDate = Math.floor(new Date(`${end.value}T23:59:59`).getTime() / 1000);
  if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) return null;
  return { startDate, endDate };
};

const updateCards = async () => {
  if (!!start.value && !!end.value) {
    let startDate = new Date(start.value).getTime() / 1000;
    let endDate = new Date(end.value).getTime() / 1000;

    const temp = await AppStore.getTemperatureMMAR(startDate, endDate);
    const humid = await AppStore.getHumidityMMAR(startDate, endDate);
    console.log(humid);

    temperature.max = temp[0].max.toFixed(1);
    temperature.min = temp[0].min.toFixed(1);
    temperature.avg = temp[0].avg.toFixed(1);
    temperature.range = temp[0].range.toFixed(1);

    humidity.max = humid[0].max.toFixed(1);
    humidity.min = humid[0].min.toFixed(1);
    humidity.avg = humid[0].avg.toFixed(1);
    humidity.range = humid[0].range.toFixed(1);
  }
};

const updateLineCharts = async () => {
  const range = getRange();
  if (!range) return;

  const rows = await AppStore.getAllInRange(range.startDate, range.endDate);

  const tempData = [];
  const heatIndexData = [];
  const humidityData = [];

  rows.forEach((row) => {
    const timestamp = Number(row.timestamp);
    if (!Number.isFinite(timestamp)) return;

    const x = timestamp * 1000;
    const t = Number(row.temperature);
    const hi = Number(row.heatindex);
    const h = Number(row.humidity);

    if (Number.isFinite(t)) tempData.push([x, t]);
    if (Number.isFinite(hi)) heatIndexData.push([x, hi]);
    if (Number.isFinite(h)) humidityData.push([x, h]);
  });

  if (lineChart.value) {
    lineChart.value.series[0].setData(tempData);
    lineChart.value.series[1].setData(heatIndexData);
  }

  if (humidityLineChart.value) {
    humidityLineChart.value.series[0].setData(humidityData);
  }
};

const updateHistogramCharts = async () => {
  if (!!start.value && !!end.value) {
    let startDate = new Date(start.value).getTime() / 1000;
    let endDate = new Date(end.value).getTime() / 1000;

    const temp = await AppStore.getFreqDistro("temperature", startDate, endDate);
    const humid = await AppStore.getFreqDistro("humidity", startDate, endDate);
    const hi = await AppStore.getFreqDistro("heatindex", startDate, endDate);

    let temperature = [];
    let humidity = [];
    let heatindex = [];

    temp.forEach((row) => {
      temperature.push({ x: row["_id"], y: row["count"] });
    });

    humid.forEach((row) => {
      humidity.push({ x: row["_id"], y: row["count"] });
    });

    hi.forEach((row) => {
      heatindex.push({ x: row["_id"], y: row["count"] });
    });

    histogramChart.value.series[0].setData(temperature);
    histogramChart.value.series[1].setData(humidity);
    histogramChart.value.series[2].setData(heatindex);
  }
};

const updateScatterCharts = async () => {
  const range = getRange();
  if (!range) return;

  const rows = await AppStore.getAllInRange(range.startDate, range.endDate);

  const tempHi = [];
  const humidHi = [];

  rows.forEach((row) => {
    const t = Number(row.temperature);
    const h = Number(row.humidity);
    const hi = Number(row.heatindex);

    if (Number.isFinite(t) && Number.isFinite(hi)) tempHi.push([t, hi]);
    if (Number.isFinite(h) && Number.isFinite(hi)) humidHi.push([h, hi]);
  });

  if (tempHeatScatterChart.value) {
    tempHeatScatterChart.value.series[0].setData(tempHi);
  }

  if (humidHeatScatterChart.value) {
    humidHeatScatterChart.value.series[0].setData(humidHi);
  }
};

onMounted(() => {
  lineChart.value = Highcharts.chart("container", {
    title: { text: "Temperature and Heat Index Analysis", align: "left" },
    subtitle: {
      text: 'The heat index, also known as the "apparent temperature," is a measure that combines air temperature and relative humidity to assess how hot it feels to the human body. The relationship between heat index and air temperature is influenced by humidity levels. As humidity increases, the heat index also rises, making the perceived temperature higher than the actual air temperature.',
    },
    chart: { zoomType: "x" },
    xAxis: { type: "datetime", title: { text: "Time" } },
    yAxis: { title: { text: "Air Temperature & Heat Index" }, labels: { format: "{value} °C" } },
    tooltip: { shared: true },
    series: [
      { type: "line", name: "Temperature", data: [], tooltip: { pointFormat: "Humidity: {point.x} % <br/> Temperature: {point.y} °C" } },
      { type: "line", name: "Heat Index", data: [], tooltip: { pointFormat: "Humidity: {point.x} % <br/> Temperature: {point.y} °C" } },
    ],
    credits: { enabled: false },
  });

  humidityLineChart.value = Highcharts.chart("container0", {
    title: { text: "Humidity Analysis", align: "left" },
    chart: { zoomType: "x" },
    xAxis: { type: "datetime", title: { text: "Time" } },
    yAxis: { title: { text: "Air Temperature & Heat Index" }, labels: { format: "{value} %" } },
    tooltip: { shared: true },
    series: [{ type: "line", name: "Humidity", data: [], tooltip: { pointFormat: "Humidity: {point.x} % <br/> Temperature: {point.y} °C" } }],
    credits: { enabled: false },
  });

  histogramChart.value = Highcharts.chart("container1", {
    title: { text: "Frequency Distribution Analysis", align: "left" },
    chart: { type: "column", zoomType: "x" },
    xAxis: { type: "category", title: { text: "Bins" } },
    yAxis: { title: { text: "Frequency" } },
    tooltip: { shared: true },
    series: [
      { type: "column", name: "Temperature", data: [] },
      { type: "column", name: "Humidity", data: [] },
      { type: "column", name: "Heat Index", data: [] },
    ],
    credits: { enabled: false },
  });

  tempHeatScatterChart.value = Highcharts.chart("container2", {
    title: { text: "Temperature & Heat Index Correlation Analysis", align: "left" },
    subtitle: { text: "Visualize the relationship between Temperature and Heat Index as well as revealing patterns or trends in the data" },
    chart: { type: "scatter", zoomType: "x" },
    xAxis: { title: { text: "Temperature" }, labels: { format: "{value} °C" } },
    yAxis: { title: { text: "Heat Index" }, labels: { format: "{value} °C" } },
    series: [{ type: "scatter", name: "Analysis", data: [], tooltip: { pointFormat: "Temperature: {point.x} °C <br/> Heat Index: {point.y} °C" } }],
    credits: { enabled: false },
  });

  humidHeatScatterChart.value = Highcharts.chart("container3", {
    title: { text: "Humidity & Heat Index Correlation Analysis", align: "left" },
    subtitle: { text: "Visualize the relationship between Humidity and Heat Index as well as revealing patterns or trends in the data" },
    chart: { type: "scatter", zoomType: "x" },
    xAxis: { title: { text: "Humidity" }, labels: { format: "{value} %" } },
    yAxis: { title: { text: "Heat Index" }, labels: { format: "{value} °C" } },
    series: [{ type: "scatter", name: "Analysis", data: [], tooltip: { pointFormat: "Humidity: {point.x} % <br/> Heat Index: {point.y} °C" } }],
    credits: { enabled: false },
  });
});
</script>

<style scoped>
.analysis-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.analysis-row {
  max-width: 1200px;
}

.highcharts-figure {
  width: 100%;
  margin: 0;
}

#container,
#container0,
#container1,
#container2,
#container3 {
  width: 100%;
  min-height: 320px;
}
</style>

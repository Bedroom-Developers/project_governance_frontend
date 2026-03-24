"use client";

import * as React from "react";
import { Circle, Map, Placemark, Polygon, Polyline, YMaps } from "@pbe/react-yandex-maps";

import { cn } from "@/shared/lib/utils";

type YandexMapProps = {
  /** Координаты центра карты [широта, долгота] */
  center?: [number, number];
  /** Координаты метки [широта, долгота] */
  placemark?: [number, number];
  /** Регион — для подстановки координат по названию города */
  region?: string;
  /** Уровень зума (1–19) */
  zoom?: number;
  /** Показать границу Аягоза и точку спорткомплекса */
  showAyagoz?: boolean;
  /** Показать всю карту Казахстана с областями и городами */
  showKazakhstanOverview?: boolean;
  /** Название объекта для балуна */
  constructionTitle?: string;
  /** Адрес для балуна */
  constructionAddress?: string;
  className?: string;
};

type RegionLayer = {
  id: string;
  name: string;
  center: [number, number];
  polygon: [number, number][];
  keywords: string[];
};

type CityMarker = {
  name: string;
  coords: [number, number];
  region: string;
};

/** Координаты городов и регионов Казахстана */
const REGION_COORDS: Record<string, [number, number]> = {
  "Аягоз": [47.97, 80.43],
  "г. Аягоз": [47.97, 80.43],
  "Алматы": [43.24, 76.91],
  "Алматы область": [45.2, 78.0],
  "Астана": [51.16, 71.47],
  "Астана қаласы": [51.16, 71.47],
  "Семей": [50.41, 80.25],
  "Абай область": [49.8, 80.7],
  "Область Абай": [49.8, 80.7],
  "Шымкент": [42.34, 69.59],
  "Шымкент қаласы": [42.34, 69.59],
  "Караганда": [49.8, 73.1],
  "Карагандинская область": [48.7, 72.9],
  "Усть-Каменогорск": [49.95, 82.61],
  "ВКО": [49.95, 82.61],
  "Восточно-Казахстанская": [49.95, 82.61],
  "Павлодар": [52.29, 76.97],
  "Костанай": [53.22, 63.63],
  "Кокшетау": [53.29, 69.39],
  "Петропавловск": [54.87, 69.15],
  "Актобе": [50.28, 57.17],
  "Атырау": [47.11, 51.92],
  "Уральск": [51.23, 51.39],
  "Актау": [43.65, 51.16],
  "Кызылорда": [44.85, 65.5],
  "Тараз": [42.9, 71.37],
  "Туркестан": [43.3, 68.25],
  "Талдыкорган": [45.01, 78.37],
  "Конаев": [43.87, 77.06],
  "Жезказган": [47.8, 67.71],
};

const DEFAULT_CENTER: [number, number] = [47.97, 80.43]; // Аягоз
const KAZAKHSTAN_CENTER: [number, number] = [48.2, 66.5];

/** Спорткомплекс ул. Шакенова, Аягоз [lat, lon] */
const SPORTS_COMPLEX_COORDS: [number, number] = [47.968, 80.435];

/** Граница Аягоза (приблиз.) Yandex Polygon: [[lon, lat], ...], замкнутый контур */
const AYAGOZ_POLYGON: [number, number][] = [
  [80.42, 47.985],
  [80.44, 47.99],
  [80.46, 47.98],
  [80.47, 47.96],
  [80.45, 47.94],
  [80.43, 47.945],
  [80.41, 47.95],
  [80.40, 47.965],
  [80.42, 47.985],
];

const KAZAKHSTAN_OUTLINE: [number, number][] = [
  [70.962315, 42.266154],
  [70.388965, 42.081308],
  [69.070027, 41.384244],
  [68.632483, 40.668681],
  [68.259896, 40.662325],
  [67.985856, 41.135991],
  [66.714047, 41.168444],
  [66.510649, 41.987644],
  [66.023392, 41.994646],
  [66.098012, 42.99766],
  [64.900824, 43.728081],
  [63.185787, 43.650075],
  [62.0133, 43.504477],
  [61.05832, 44.405817],
  [60.239972, 44.784037],
  [58.689989, 45.500014],
  [58.503127, 45.586804],
  [55.928917, 44.995858],
  [55.968191, 41.308642],
  [55.455251, 41.259859],
  [54.755345, 42.043971],
  [54.079418, 42.324109],
  [52.944293, 42.116034],
  [52.50246, 41.783316],
  [52.446339, 42.027151],
  [52.692112, 42.443895],
  [52.501426, 42.792298],
  [51.342427, 43.132975],
  [50.891292, 44.031034],
  [50.339129, 44.284016],
  [50.305643, 44.609836],
  [51.278503, 44.514854],
  [51.316899, 45.245998],
  [52.16739, 45.408391],
  [53.040876, 45.259047],
  [53.220866, 46.234646],
  [53.042737, 46.853006],
  [52.042023, 46.804637],
  [51.191945, 47.048705],
  [50.034083, 46.60899],
  [49.10116, 46.39933],
  [48.593241, 46.561034],
  [48.694734, 47.075628],
  [48.057253, 47.743753],
  [47.315231, 47.715847],
  [46.466446, 48.394152],
  [47.043672, 49.152039],
  [46.751596, 49.356006],
  [47.54948, 50.454698],
  [48.577841, 49.87476],
  [48.702382, 50.605128],
  [50.766648, 51.692762],
  [52.328724, 51.718652],
  [54.532878, 51.02624],
  [55.716941, 50.621717],
  [56.777961, 51.043551],
  [58.363291, 51.063653],
  [59.642282, 50.545442],
  [59.932807, 50.842194],
  [61.337424, 50.79907],
  [61.588003, 51.272659],
  [59.967534, 51.96042],
  [60.927269, 52.447548],
  [60.739993, 52.719986],
  [61.699986, 52.979996],
  [60.978066, 53.664993],
  [61.436591, 54.006265],
  [65.178534, 54.354228],
  [65.666876, 54.601267],
  [68.1691, 54.970392],
  [69.068167, 55.38525],
  [70.865267, 55.169734],
  [71.180131, 54.133285],
  [72.22415, 54.376655],
  [73.508516, 54.035617],
  [73.425679, 53.48981],
  [74.384845, 53.546861],
  [76.8911, 54.490524],
  [76.525179, 54.177003],
  [77.800916, 53.404415],
  [80.03556, 50.864751],
  [80.568447, 51.388336],
  [81.945986, 50.812196],
  [83.383004, 51.069183],
  [83.935115, 50.889246],
  [84.416377, 50.3114],
  [85.11556, 50.117303],
  [85.54127, 49.692859],
  [86.829357, 49.826675],
  [87.35997, 49.214981],
  [86.598776, 48.549182],
  [85.768233, 48.455751],
  [85.720484, 47.452969],
  [85.16429, 47.000956],
  [83.180484, 47.330031],
  [82.458926, 45.53965],
  [81.947071, 45.317027],
  [79.966106, 44.917517],
  [80.866206, 43.180362],
  [80.18015, 42.920068],
  [80.25999, 42.349999],
  [79.643645, 42.496683],
  [79.142177, 42.856092],
  [77.658392, 42.960686],
  [76.000354, 42.988022],
  [75.636965, 42.8779],
  [74.212866, 43.298339],
  [73.645304, 43.091272],
  [73.489758, 42.500894],
  [71.844638, 42.845395],
  [71.186281, 42.704293],
  [70.962315, 42.266154],
];

const KAZAKHSTAN_REGIONS: RegionLayer[] = [
  {
    id: "west-kazakhstan",
    name: "Западно-Казахстанская область",
    center: [50.5, 51.3],
    keywords: ["зко", "уральск", "западно-казахстан"],
    polygon: [
      [47.6, 49.0],
      [52.1, 49.0],
      [54.8, 50.8],
      [54.7, 52.6],
      [50.2, 52.8],
      [47.6, 51.2],
      [47.6, 49.0],
    ],
  },
  {
    id: "atyrau",
    name: "Атырауская область",
    center: [47.4, 52.3],
    keywords: ["атырау", "атырауск"],
    polygon: [
      [46.2, 46.3],
      [53.8, 46.3],
      [55.0, 48.8],
      [52.5, 49.7],
      [48.0, 49.2],
      [46.2, 47.7],
      [46.2, 46.3],
    ],
  },
  {
    id: "mangystau",
    name: "Мангистауская область",
    center: [43.9, 53.0],
    keywords: ["мангиста", "актау", "мангистау"],
    polygon: [
      [49.8, 41.2],
      [55.8, 41.2],
      [56.6, 44.7],
      [54.5, 46.8],
      [50.6, 46.5],
      [49.8, 41.2],
    ],
  },
  {
    id: "aktobe",
    name: "Актюбинская область",
    center: [49.6, 58.1],
    keywords: ["актобе", "актюбин"],
    polygon: [
      [52.8, 47.2],
      [63.8, 47.2],
      [64.6, 50.8],
      [60.7, 52.6],
      [54.6, 51.9],
      [52.8, 49.2],
      [52.8, 47.2],
    ],
  },
  {
    id: "kostanay",
    name: "Костанайская область",
    center: [52.8, 64.2],
    keywords: ["костанай", "костанайск"],
    polygon: [
      [60.0, 49.8],
      [69.2, 49.8],
      [69.2, 54.8],
      [61.0, 54.8],
      [60.0, 49.8],
    ],
  },
  {
    id: "north-kazakhstan",
    name: "Северо-Казахстанская область",
    center: [54.3, 69.8],
    keywords: ["северо-казахстан", "петропавловск", "ско"],
    polygon: [
      [68.0, 52.9],
      [74.8, 52.9],
      [74.8, 55.4],
      [68.0, 55.4],
      [68.0, 52.9],
    ],
  },
  {
    id: "akmola",
    name: "Акмолинская область",
    center: [51.5, 70.6],
    keywords: ["акмол", "кокшетау", "астана"],
    polygon: [
      [65.8, 50.0],
      [73.9, 50.0],
      [73.9, 53.9],
      [66.2, 53.9],
      [65.8, 50.0],
    ],
  },
  {
    id: "pavlodar",
    name: "Павлодарская область",
    center: [52.5, 76.5],
    keywords: ["павлодар", "экибастуз"],
    polygon: [
      [73.2, 49.8],
      [79.8, 49.8],
      [79.8, 54.9],
      [73.2, 54.9],
      [73.2, 49.8],
    ],
  },
  {
    id: "ulytau",
    name: "Область Улытау",
    center: [47.4, 67.5],
    keywords: ["улытау", "жезказган", "жезқазған"],
    polygon: [
      [62.5, 44.3],
      [69.8, 44.3],
      [70.0, 48.8],
      [63.5, 49.1],
      [62.5, 44.3],
    ],
  },
  {
    id: "karaganda",
    name: "Карагандинская область",
    center: [48.3, 73.1],
    keywords: ["караганда", "карагандин"],
    polygon: [
      [68.0, 45.2],
      [76.8, 45.2],
      [76.8, 50.6],
      [69.2, 50.6],
      [68.0, 45.2],
    ],
  },
  {
    id: "abai",
    name: "Область Абай",
    center: [49.6, 80.3],
    keywords: ["абай", "семей", "аягоз"],
    polygon: [
      [76.2, 46.5],
      [84.8, 46.5],
      [84.8, 51.7],
      [77.2, 51.7],
      [76.2, 46.5],
    ],
  },
  {
    id: "east-kazakhstan",
    name: "Восточно-Казахстанская область",
    center: [49.7, 84.1],
    keywords: ["вко", "восточно-казахстан", "усть-каменогорск", "оскемен"],
    polygon: [
      [81.0, 47.4],
      [87.8, 47.4],
      [87.8, 51.8],
      [81.0, 51.8],
      [81.0, 47.4],
    ],
  },
  {
    id: "kyzylorda",
    name: "Кызылординская область",
    center: [44.7, 64.7],
    keywords: ["кызылорд", "байконур"],
    polygon: [
      [58.6, 41.8],
      [68.2, 41.8],
      [68.2, 45.8],
      [59.6, 46.0],
      [58.6, 41.8],
    ],
  },
  {
    id: "turkistan",
    name: "Туркестанская область",
    center: [42.8, 69.2],
    keywords: ["туркестан", "шымкент", "кентау"],
    polygon: [
      [65.8, 40.3],
      [72.6, 40.3],
      [72.8, 43.6],
      [66.4, 43.7],
      [65.8, 40.3],
    ],
  },
  {
    id: "zhambyl",
    name: "Жамбылская область",
    center: [43.1, 71.9],
    keywords: ["жамбыл", "тараз"],
    polygon: [
      [69.0, 41.9],
      [75.3, 41.9],
      [75.3, 45.0],
      [69.2, 45.0],
      [69.0, 41.9],
    ],
  },
  {
    id: "almaty-region",
    name: "Алматинская область",
    center: [44.6, 77.8],
    keywords: ["алматинская", "конаев", "қонаев"],
    polygon: [
      [74.6, 42.8],
      [80.5, 42.8],
      [81.0, 45.8],
      [75.3, 46.1],
      [74.6, 42.8],
    ],
  },
  {
    id: "zhetysu",
    name: "Область Жетысу",
    center: [45.5, 79.0],
    keywords: ["жетысу", "талдыкорган", "текели"],
    polygon: [
      [76.1, 44.1],
      [82.8, 44.1],
      [82.8, 47.8],
      [76.4, 47.8],
      [76.1, 44.1],
    ],
  },
];

const KAZAKHSTAN_CITIES: CityMarker[] = [
  { name: "Астана", coords: [51.16, 71.47], region: "Астана" },
  { name: "Алматы", coords: [43.24, 76.91], region: "Алматы" },
  { name: "Шымкент", coords: [42.34, 69.59], region: "Шымкент" },
  { name: "Сарыагаш", coords: [41.46, 69.17], region: "Туркестанская область" },
  { name: "Жетысай", coords: [40.77, 68.33], region: "Туркестанская область" },
  { name: "Арыс", coords: [42.43, 68.8], region: "Туркестанская область" },
  { name: "Семей", coords: [50.41, 80.25], region: "Область Абай" },
  { name: "Аягоз", coords: [47.97, 80.43], region: "Область Абай" },
  { name: "Усть-Каменогорск", coords: [49.95, 82.61], region: "ВКО" },
  { name: "Павлодар", coords: [52.29, 76.97], region: "Павлодарская область" },
  { name: "Караганда", coords: [49.8, 73.1], region: "Карагандинская область" },
  { name: "Жезказган", coords: [47.8, 67.71], region: "Область Улытау" },
  { name: "Костанай", coords: [53.22, 63.63], region: "Костанайская область" },
  { name: "Кокшетау", coords: [53.29, 69.39], region: "Акмолинская область" },
  { name: "Петропавловск", coords: [54.87, 69.15], region: "Северо-Казахстанская область" },
  { name: "Актобе", coords: [50.28, 57.17], region: "Актюбинская область" },
  { name: "Атырау", coords: [47.11, 51.92], region: "Атырауская область" },
  { name: "Уральск", coords: [51.23, 51.39], region: "Западно-Казахстанская область" },
  { name: "Актау", coords: [43.65, 51.16], region: "Мангистауская область" },
  { name: "Кызылорда", coords: [44.85, 65.5], region: "Кызылординская область" },
  { name: "Байконур", coords: [45.62, 63.31], region: "Кызылординская область" },
  { name: "Тараз", coords: [42.9, 71.37], region: "Жамбылская область" },
  { name: "Шу", coords: [43.6, 73.76], region: "Жамбылская область" },
  { name: "Туркестан", coords: [43.3, 68.25], region: "Туркестанская область" },
  { name: "Талдыкорган", coords: [45.01, 78.37], region: "Область Жетысу" },
  { name: "Текели", coords: [44.83, 78.82], region: "Область Жетысу" },
  { name: "Конаев", coords: [43.87, 77.06], region: "Алматинская область" },
  { name: "Каскелен", coords: [43.2, 76.62], region: "Алматинская область" },
];

function getCenterByRegion(region?: string): [number, number] {
  if (!region) return DEFAULT_CENTER;
  const coords = REGION_COORDS[region.trim()];
  return coords ?? DEFAULT_CENTER;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isRegionMatch(regionText: string | undefined, keywords: string[]) {
  if (!regionText) return false;
  const normalized = normalizeText(regionText);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

export function YandexMap({
  center,
  placemark,
  region,
  zoom = 12,
  showAyagoz = false,
  showKazakhstanOverview = false,
  constructionTitle,
  constructionAddress,
  className,
}: YandexMapProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ??
    "dbf6cdc4-cb29-44c9-acbb-69b99c78b541";
  const mapCenter = center ?? (showKazakhstanOverview ? KAZAKHSTAN_CENTER : getCenterByRegion(region));
  const mapZoom = showKazakhstanOverview ? 5 : zoom;
  const regionCenter = getCenterByRegion(region);
  const markCoords = placemark ?? (showAyagoz ? SPORTS_COMPLEX_COORDS : regionCenter);

  const [centerLat, centerLon] = SPORTS_COMPLEX_COORDS;

  const balloonHtml = [
    "<div style='padding:4px;min-width:180px;font-family:system-ui,sans-serif'>",
    "<strong style='font-size:14px'>",
    constructionTitle ?? "Строительство спортивного комплекса",
    "</strong>",
    "<p style='margin:6px 0 0;font-size:12px;color:#4b5563'>",
    constructionAddress ?? "г. Аягоз, ул. Шакенова",
    "</p>",
    "<p style='margin:4px 0 0;font-size:11px;color:#6b7280'>",
    "Объект в зоне строительства",
    "</p>",
    "</div>",
  ].join("");

  return (
    <div className={cn("h-[240px] w-full overflow-hidden rounded-lg", className)}>
      <YMaps
        query={{
          apikey: apiKey,
          lang: "ru_RU",
        }}
      >
        <Map
          state={{
            center: mapCenter,
            zoom: mapZoom,
          }}
          width="100%"
          height="100%"
        >
          {showKazakhstanOverview && (
            <>
              <Polygon
                geometry={[KAZAKHSTAN_OUTLINE.map(([lon, lat]) => [lat, lon])]}
                options={{
                  fillColor: "rgba(56, 189, 248, 0.14)",
                  strokeColor: "rgba(0,0,0,0)",
                  strokeWidth: 0,
                }}
              />
              <Polyline
                geometry={KAZAKHSTAN_OUTLINE.map(([lon, lat]) => [lat, lon])}
                options={{
                  strokeColor: "rgba(255,255,255,0.9)",
                  strokeWidth: 4,
                  strokeOpacity: 0.9,
                }}
              />
              <Polyline
                geometry={KAZAKHSTAN_OUTLINE.map(([lon, lat]) => [lat, lon])}
                properties={{
                  hintContent: "Казахстан",
                  balloonContent:
                    "<div style='padding:4px;min-width:160px;font-family:system-ui,sans-serif'><strong>Казахстан</strong></div>",
                }}
                options={{
                  strokeColor: "#38bdf8",
                  strokeWidth: 2.2,
                  strokeOpacity: 0.95,
                }}
              />
            </>
          )}

          {showKazakhstanOverview &&
            KAZAKHSTAN_CITIES.map((city) => (
              <Placemark
                key={city.name}
                geometry={city.coords}
                properties={{
                  hintContent: city.name,
                  balloonContent: [
                    "<div style='padding:4px;min-width:160px;font-family:system-ui,sans-serif'>",
                    `<strong style='font-size:14px'>${city.name}</strong>`,
                    `<p style='margin:6px 0 0;font-size:12px;color:#4b5563'>${city.region}</p>`,
                    "</div>",
                  ].join(""),
                }}
                options={{
                  preset: "islands#darkBlueCircleDotIcon",
                }}
              />
            ))}

          {showAyagoz && (
            <>
              <Polygon
                geometry={[AYAGOZ_POLYGON]}
                options={{
                  fillColor: "rgba(0, 175, 255, 0.15)",
                  strokeColor: "#00BFFF",
                  strokeWidth: 2,
                }}
              />
              <Circle
                geometry={[[centerLat, centerLon], 150]}
                options={{
                  fill: false,
                  strokeColor: "#dc2626",
                  strokeWidth: 3,
                }}
              />
              <Circle
                geometry={[[centerLat, centerLon], 350]}
                options={{
                  fill: false,
                  strokeColor: "#f87171",
                  strokeWidth: 2,
                  strokeStyle: "dash",
                }}
              />
              <Placemark
                geometry={SPORTS_COMPLEX_COORDS}
                properties={{
                  balloonContent: balloonHtml,
                }}
                options={{
                  preset: "islands#blueIcon",
                }}
              />
            </>
          )}
          {!showAyagoz && !showKazakhstanOverview && <Placemark geometry={markCoords} />}

          {showKazakhstanOverview && !showAyagoz && (
            <Placemark
              geometry={markCoords}
              properties={{
                balloonContent: balloonHtml,
              }}
              options={{
                preset: "islands#violetIcon",
              }}
            />
          )}
        </Map>
      </YMaps>
    </div>
  );
}

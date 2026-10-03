export const deliveryLabels = {
  az: { metroPickup: "Metroda təhvil — 4 AZN", station: "Metro stansiyası", choose: "Metro seçin", nearest: "Ən yaxın metro", metroDistance: "Metroya düz xətt məsafəsi", storeDistance: "Mağazaya düz xətt məsafəsi", calculating: "Hesablanır…", unavailable: "Çatdırılma qiyməti hesablanmadı", retry: "Yenidən hesabla", metroRequired: "Təhvil üçün metro seçin.", pending: "Çatdırılma hesablamasının tamamlanmasını gözləyin.", hint: "Ünvana çatdırılmada ən yaxın metro avtomatik müəyyən edilir. 1 km-dək 6 AZN, 1–2 km 7 AZN; daha uzaqda mağazadan məsafəyə görə hesablanır.", stationError: "Metro siyahısı yüklənmədi.", noStations: "Hazırda metroda təhvil mümkün deyil.", metroRule: "Metro yaxınlığı tarifi", storeRule: "Mağazadan məsafə tarifi" },
  en: { metroPickup: "Metro handover — 4 AZN", station: "Metro station", choose: "Choose a station", nearest: "Nearest metro", metroDistance: "Straight-line distance to metro", storeDistance: "Straight-line distance to store", calculating: "Calculating…", unavailable: "Delivery could not be calculated", retry: "Retry calculation", metroRequired: "Choose a metro for handover.", pending: "Wait for the delivery calculation.", hint: "The nearest metro is selected automatically for address delivery. Up to 1 km: 6 AZN; 1–2 km: 7 AZN; beyond 2 km the store-distance tariff applies.", stationError: "Metro stations could not be loaded.", noStations: "Metro handover is currently unavailable.", metroRule: "Metro proximity tariff", storeRule: "Store-distance tariff" },
  ru: { metroPickup: "Передача у метро — 4 AZN", station: "Станция метро", choose: "Выберите метро", nearest: "Ближайшее метро", metroDistance: "Расстояние до метро по прямой", storeDistance: "Расстояние до магазина по прямой", calculating: "Расчёт…", unavailable: "Не удалось рассчитать доставку", retry: "Повторить расчёт", metroRequired: "Выберите станцию для передачи.", pending: "Дождитесь расчёта доставки.", hint: "Ближайшее метро определяется автоматически. До 1 км: 6 AZN; 1–2 км: 7 AZN; дальше 2 км — тариф по расстоянию от магазина.", stationError: "Не удалось загрузить станции метро.", noStations: "Передача у метро сейчас недоступна.", metroRule: "Тариф рядом с метро", storeRule: "Тариф от магазина" },
};

export function deliveryQuoteKey({ deliveryType, latitude, longitude, metroStationId }) {
  const type = Number(deliveryType);
  return type === 1 ? `1:${latitude}:${longitude}` : type === 3 ? `3:${metroStationId || ""}` : String(type);
}

export function deliveryQuoteMatches(state, form) {
  return state.key === deliveryQuoteKey(form) && !state.pending && state.available;
}

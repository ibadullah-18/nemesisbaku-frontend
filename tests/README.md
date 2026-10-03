# Tanıtım bloklarının yoxlanması

- Məntiq testləri: `node --test tests/showcase.test.mjs`
- Lokal vizual yoxlama: Vite açıq olarkən `/tests/showcase-preview.html`.
- Admin redaktoru: `/tests/showcase-preview.html?view=admin`.
- Qrup siyahısı: `/tests/showcase-preview.html?view=list`.
- Detallı səhifə: `/tests/showcase-preview.html?view=detail`.

Vizual sınaqda bütün API sorğuları saxta cavablarla əvəz olunur. Real bazaya və
şəkil xidmətinə yazılmır. Rəngli nümunə şəkilləri yalnız bu sınaq səhifəsindədir;
istehsal build-inə və müştəri səhifələrinə əlavə olunmur.

Yoxlanmış hallar: ilk 40 məhsul, 15 və 30-dan sonra yerləşdirmə, “Daha çox” ilə
45-ci məhsuldan sonra növbəti qrup, keçidsiz blokda düymənin olmaması, daxili
səhifənin açılması, 390px ekranda alt-alta düzülmə və üfüqi daşmanın olmaması.

Backend-də `AddShowcaseGroups` migration-ı tələb olunur. Əvvəl yeni API versiyası,
sonra frontend yayımlanmalıdır. API-nin mövcud başlanğıc prosesi migration-ları
tətbiq edir. Bu iş zamanı canlı bazaya migration tətbiq edilməyib.

## Metro çatdırılması

`/tests/delivery-preview.html` React hook-u ilə 11 avtomatik brauzer yoxlaması
işlədir: köhnə cavabın gec gəlməsi, xəritədə nöqtənin dəyişməsi, əvvəlki nöqtəyə
qayıtma, sorğu xətası və təkrar cəhd, metro seçimi və pulsuz mağazadan götürmə.
`/tests/delivery-preview.html?view=admin` saxta məlumatlarla metro redaktorudur.
Bu səhifələr real API-yə sorğu göndərmir və production build-ə daxil deyil.

Yayımlama sırası: əvvəl `AddMetroDelivery` migration-ını ehtiva edən API,
sonra frontend. Sifarişin yaradılması cavabı artıq yalnız ID əvəzinə serverdə
hesablanan qiymətləri də qaytarır. Metro məlumatları migration ilə bir dəfə
yüklənir; sonrakı admin dəyişiklikləri qorunur. Canlı bazada tətbiq edilməyib.

## Baxış statistikası və mobil görünüş

- `node --test tests/traffic.test.mjs`: 30 dəqiqəlik sessiya sərhədi, daxili
  yolların çıxarılması, Bakı vaxtı ilə tarix aralığı.
- `/tests/storefront-preview.html`: çox və tək şəkilli kart, kampaniya,
  nöqtə keçidləri; `?view=login` və `?view=register`: mövcud giriş/qeydiyyat formaları.
  Bütün API sorğuları bu fixture-də saxtadır; real hesab və statistika yaradılmır.
- Mobil 390px görünüşdə oxların gizlənməsi, nöqtə ilə şəkil keçidi,
  tək şəkildə nöqtə olmaması və üfüqi daşmanın olmaması yoxlanılıb.
- API-də `AddTrafficStatisticsPeriods`, sonra `AddPageViewEvents` migration-ları
  tələb olunur. API frontend-dən əvvəl yayımlanmalıdır. Köhnə yalnız-ana-səhifə
  qeydləri yeni baxış saylarına daxil edilmir. Yeni məlumatlar silinmədən
  hesablama başlanğıcı dəyişdirilir; mövcud saxlanma/təmizləmə siyasəti qüvvədədir.
- Unikal ziyarətçi brauzer identifikatorudur; cihazlararası insan tanıma və
  bütün botları aşkarlama zəmanəti yoxdur. Yerli/dev rejimində tracking sönükdür.

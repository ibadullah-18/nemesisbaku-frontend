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

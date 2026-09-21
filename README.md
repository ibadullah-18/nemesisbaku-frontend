# nemesisbaku homepage — mərhələ 1

Bu paket mövcud API məntiqini dəyişmədən homepage dizaynını yeniləyir.

## Əlavə olunanlar

- backend kampaniyaları ilə işləyən premium 3D hero;
- ThreeUI `DotMatrixBackground` WebGL effekti;
- desktop üçün mouse-parallax və 3D tilt;
- mobil və reduced-motion rejimində WebGL-in avtomatik söndürülməsi;
- məhsul bölmələri və kartlar üçün yumşaq 3D dərinlik;
- AZ/RU/EN “Yeni kolleksiya” tərcümələri;
- ThreeUI-nin ayrıca lazy chunk kimi yüklənməsi.

## Quraşdırma

ZIP-i frontend layihəsinin kökünə çıxarın və faylların əvəzlənməsinə icazə verin.

```powershell
cd "C:\Users\lenovo\OneDrive\Desktop\nemesis-fornted\nemesisbaku-frontend"
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

`npm.cmd` istifadə olunur, buna görə PowerShell execution-policy xətası yaranmır.

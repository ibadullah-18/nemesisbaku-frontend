import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import {
  adminBrandsApi,
  adminCategoriesApi,
  adminColorsApi,
  adminProductImagesApi,
  adminProductVariantsApi,
  adminProductsApi,
  adminSizesApi,
  listAdmin,
  unwrapAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  name: "",
  description: "",
  productCode: "",
  model: "",
  price: "",
  discountPrice: "",
  isDiscounted: false,
  isFeatured: false,
  categoryId: "",
  brandId: "",
};

const emptyVariant = {
  id: "",
  sizeId: "",
  colorId: "",
  stockCount: "",
  isNewVariant: true,
};

function localUnwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function localList(res) {
  const data = localUnwrap(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

function safeUnwrap(res) {
  try {
    return unwrapAdmin ? unwrapAdmin(res) : localUnwrap(res);
  } catch {
    return localUnwrap(res);
  }
}

function safeList(res) {
  try {
    return listAdmin ? listAdmin(res) : localList(res);
  } catch {
    return localList(res);
  }
}

function getOptionId(item) {
  return (
    item?.id ||
    item?.sizeId ||
    item?.colorId ||
    item?.brandId ||
    item?.categoryId ||
    ""
  );
}

function getVariantId(item) {
  return item?.id || item?.variantId || item?.productVariantId || "";
}

function getSizeText(item) {
  return item?.value || item?.size || item?.sizeValue || item?.name || "—";
}

function getColorText(item) {
  return item?.name || item?.colorName || "—";
}

function getCategoryName(item) {
  return item?.name || item?.categoryName || item?.title || "";
}

function getBrandName(item) {
  return item?.name || item?.brandName || item?.title || "";
}

function uniqueById(list) {
  const map = new Map();

  list.forEach((item) => {
    const id = getOptionId(item);
    if (id && !map.has(String(id))) {
      map.set(String(id), item);
    }
  });

  return [...map.values()];
}

function findIdByName(list, name, getter) {
  const text = String(name || "").trim().toLowerCase();
  if (!text) return "";

  const found = list.find(
    (item) => String(getter(item) || "").trim().toLowerCase() === text
  );

  return found ? getOptionId(found) : "";
}

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  return (
    image.imageUrl ||
    image.mainImageUrl ||
    image.url ||
    image.fileUrl ||
    image.path ||
    image.secureUrl ||
    image.src ||
    image.image ||
    image.imagePath ||
    image.photoUrl ||
    ""
  );
}

function getProductImages(product) {
  const raw =
    product?.images ||
    product?.productImages ||
    product?.imageDtos ||
    product?.productImageDtos ||
    product?.imageUrls ||
    product?.imagesUrl ||
    [];

  const list = Array.isArray(raw) ? raw : [];

  const images = list
    .map((img, index) => {
      if (typeof img === "string") {
        return {
          id: "",
          imageUrl: img,
          isMain: index === 0,
          displayOrder: index,
        };
      }

      return {
        id: img?.id || img?.imageId || img?.productImageId || "",
        imageUrl: getImageUrl(img),
        isMain: Boolean(img?.isMain || img?.isMainImage),
        displayOrder: img?.displayOrder ?? img?.order ?? index,
      };
    })
    .filter((x) => x.imageUrl)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

  const mainFromProduct =
    product?.mainImageUrl ||
    product?.imageUrl ||
    product?.image ||
    product?.photoUrl ||
    product?.coverImageUrl ||
    "";

  if (mainFromProduct && !images.some((x) => x.imageUrl === mainFromProduct)) {
    images.unshift({
      id: "",
      imageUrl: mainFromProduct,
      isMain: true,
      displayOrder: -1,
    });
  }

  return images;
}

function getProductVariants(product, sizes, colors) {
  const raw =
    product?.variants ||
    product?.productVariants ||
    product?.productVariantDtos ||
    [];

  const list = Array.isArray(raw) ? raw : [];

  return list.map((variant) => {
    const sizeText =
      variant?.sizeValue ||
      variant?.sizeName ||
      variant?.size ||
      variant?.size?.value ||
      variant?.size?.name ||
      "";

    const colorText =
      variant?.colorName ||
      variant?.color ||
      variant?.color?.name ||
      "";

    const sizeId =
      variant?.sizeId ||
      variant?.size?.id ||
      findIdByName(sizes, sizeText, getSizeText);

    const colorId =
      variant?.colorId ||
      variant?.color?.id ||
      findIdByName(colors, colorText, getColorText);

    return {
      id: getVariantId(variant),
      sizeId: sizeId || "",
      colorId: colorId || "",
      stockCount: variant?.stockCount ?? variant?.stock ?? "",
      isNewVariant: false,
    };
  });
}

export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState([]);
  const [oldImages, setOldImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [selectedImage, setSelectedImage] = useState("");
  const [oldDragIndex, setOldDragIndex] = useState(null);
  const [newDragIndex, setNewDragIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const location = useLocation();

  const basePath = location.pathname.startsWith("/Admin")
      ? "/Admin"
      : "/SuperAdmin";

  useEffect(() => {
    loadAll();

    return () => {
      newImages.forEach((img) => {
        if (img.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    if (!id || id === "undefined" || id === "null") {
      setError("Məhsul ID gəlmədi. Redaktə səhifəsi açıla bilməz.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const [productRes, catRes, brandRes, sizeRes, colorRes] =
        await Promise.all([
          adminProductsApi.detail(id),
          adminCategoriesApi.list(),
          adminBrandsApi.list(),
          adminSizesApi.list(),
          adminColorsApi.list(),
        ]);

      const product = safeUnwrap(productRes);

      const loadedCategories = uniqueById(safeList(catRes));
      const loadedBrands = uniqueById(safeList(brandRes));
      const loadedSizes = uniqueById(safeList(sizeRes));
      const loadedColors = uniqueById(safeList(colorRes));

      setCategories(loadedCategories);
      setBrands(loadedBrands);
      setSizes(loadedSizes);
      setColors(loadedColors);

      const categoryId =
        product?.categoryId ||
        product?.category?.id ||
        findIdByName(
          loadedCategories,
          product?.categoryName || product?.category?.name,
          getCategoryName
        );

      const brandId =
        product?.brandId ||
        product?.brand?.id ||
        findIdByName(
          loadedBrands,
          product?.brandName || product?.brand?.name,
          getBrandName
        );

      setForm({
        name: product?.name || "",
        description: product?.description || "",
        productCode: product?.productCode || "",
        model: product?.model || "",
        price: product?.price ?? "",
        discountPrice: product?.discountPrice ?? "",
        isDiscounted: Boolean(product?.isDiscounted),
        isFeatured: Boolean(product?.isFeatured),
        categoryId: categoryId || "",
        brandId: brandId || "",
      });

      const images = getProductImages(product);
      setOldImages(images);
      setSelectedImage(images[0]?.imageUrl || "");

      const loadedVariants = getProductVariants(product, loadedSizes, loadedColors);
      setVariants(loadedVariants.length ? loadedVariants : [{ ...emptyVariant }]);

      console.log("EDIT PRODUCT DETAIL:", product);
      console.log("EDIT PRODUCT IMAGES:", images);
      console.log("EDIT SELECTED CATEGORY ID:", categoryId);
      console.log("EDIT SELECTED BRAND ID:", brandId);
    } catch (err) {
      setError(err.message || "Məhsul məlumatları yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateVariant(index, key, value) {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant
      )
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  }

  async function removeVariant(index) {
    const variant = variants[index];

    if (variant?.id && !variant.isNewVariant) {
      const ok = confirm("Bu variant silinsin?");
      if (!ok) return;

      try {
        setSaving(true);
        setError("");

        await adminProductVariantsApi.delete(variant.id);
        setVariants((prev) => prev.filter((_, i) => i !== index));
      } catch (err) {
        setError(err.message || "Variant silinmədi.");
      } finally {
        setSaving(false);
      }

      return;
    }

    setVariants((prev) => prev.filter((_, i) => i !== index));
  }
  

  function handleImages(e) {
    const files = Array.from(e.target.files || []);

    const mapped = files.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  }

  function removeNewImage(imageId) {
    setNewImages((prev) => {
      const target = prev.find((x) => x.id === imageId);

      if (target?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
      }

      return prev.filter((x) => x.id !== imageId);
    });
  }

  async function deleteOldImage(image) {
    if (!image.id) {
      setError("Bu şəkil üçün ID gəlmədi. Backend yalnız URL göndəribsə silmək mümkün deyil.");
      return;
    }

    const ok = confirm("Bu şəkil silinsin?");
    if (!ok) return;

    try {
      setSaving(true);
      setError("");

      await adminProductImagesApi.delete(image.id);

      setOldImages((prev) => {
        const next = prev.filter((x) => x.id !== image.id);
        if (selectedImage === image.imageUrl) {
          setSelectedImage(next[0]?.imageUrl || "");
        }
        return next;
      });
    } catch (err) {
      setError(err.message || "Şəkil silinmədi.");
    } finally {
      setSaving(false);
    }
  }

async function setMainImage(image) {
  if (!image.id) {
    setError("Bu şəkil üçün ID gəlmədi.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    await adminProductImagesApi.setMain(image.id);

    setOldImages((prev) => {
      const selected = prev.find((x) => x.id === image.id);
      const others = prev.filter((x) => x.id !== image.id);

      return [
        { ...selected, isMain: true, displayOrder: 1 },
        ...others.map((x, index) => ({
          ...x,
          isMain: false,
          displayOrder: index + 2,
        })),
      ];
    });

    setSelectedImage(image.imageUrl);
  } catch (err) {
    setError(err.message || "Əsas şəkil dəyişdirilmədi.");
  } finally {
    setSaving(false);
  }
}

  function moveOldImage(from, to) {
    if (from === to || from === null || to === null) return;

    setOldImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function moveNewImage(from, to) {
    if (from === to || from === null || to === null) return;

    setNewImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function handleOldImageDrop(index) {
    moveOldImage(oldDragIndex, index);
    setOldDragIndex(null);
  }

  function handleNewImageDrop(index) {
    moveNewImage(newDragIndex, index);
    setNewDragIndex(null);
  }

async function saveOldImageOrder() {
  const imagesWithId = oldImages.filter((img) => img.id);

  if (imagesWithId.length === 0) return;

  for (let i = 0; i < imagesWithId.length; i++) {
    await adminProductImagesApi.updateOrder(imagesWithId[i].id, i + 1);
  }

  await adminProductImagesApi.setMain(imagesWithId[0].id);
}

  async function uploadNewImages() {
    for (let i = 0; i < newImages.length; i++) {
      const shouldBeMain = oldImages.length === 0 && i === 0;
      await adminProductImagesApi.upload(id, newImages[i].file, shouldBeMain);
    }
  }

  async function saveVariants() {
    const validVariants = variants.filter(
      (v) => v.sizeId && v.colorId && v.stockCount !== ""
    );

    if (validVariants.length === 0) {
      throw new Error("Ən azı 1 variant olmalıdır.");
    }

    for (const variant of validVariants) {
      const body = {
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        stockCount: Number(variant.stockCount),
      };

      if (variant.id && !variant.isNewVariant) {
        await adminProductVariantsApi.update(variant.id, body);
      } else {
        await adminProductVariantsApi.create(id, body);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) return setError("Məhsul adı yazılmalıdır.");
    if (!form.productCode.trim()) return setError("Məhsul kodu yazılmalıdır.");
    if (!form.model.trim()) return setError("Model yazılmalıdır.");
    if (!form.price || Number(form.price) <= 0) {
      return setError("Qiymət 0-dan böyük olmalıdır.");
    }
    if (!form.categoryId) return setError("Kateqoriya seçilməlidir.");
    if (!form.brandId) return setError("Brend seçilməlidir.");

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        productCode: form.productCode.trim(),
        model: form.model.trim(),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
        isDiscounted: Boolean(form.isDiscounted),
        isFeatured: Boolean(form.isFeatured),
        categoryId: form.categoryId,
        brandId: form.brandId,
      };

      console.log("UPDATE PRODUCT PAYLOAD:", payload);

      await adminProductsApi.update(id, payload);
      await saveVariants();
      await saveOldImageOrder();

      if (newImages.length > 0) {
        await uploadNewImages();
      }

      setSuccess("Məhsul uğurla yeniləndi.");
      setNewImages([]);
      await loadAll();
    } catch (err) {
      setError(err.message || "Məhsul yenilənmədi.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = useMemo(
    () =>
      categories.find((x) => String(getOptionId(x)) === String(form.categoryId)),
    [categories, form.categoryId]
  );

  const selectedBrand = useMemo(
    () => brands.find((x) => String(getOptionId(x)) === String(form.brandId)),
    [brands, form.brandId]
  );

  if (loading) return <AppLoader text="Məhsul redaktəyə açılır" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <button
        type="button"
        onClick={() => navigate(`${basePath}/products`)}
        className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.97]"
      >
        <FiArrowLeft />
        Məhsullara qayıt
      </button>

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Məhsul redaktəsi
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            {form.name || "Məhsulu yenilə"}
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Mövcud məlumatlar avtomatik seçili gəlir.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white"
        >
          <FiRefreshCw />
          Yenilə
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <FiCheckCircle />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_430px]">
        <main className="space-y-5">
          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumatlar
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput label="Məhsul adı" value={form.name} onChange={(v) => updateForm("name", v)} />
              <AdminInput label="Məhsul kodu" value={form.productCode} onChange={(v) => updateForm("productCode", v)} />
              <AdminInput label="Model" value={form.model} onChange={(v) => updateForm("model", v)} />
              <AdminInput label="Qiymət" type="number" value={form.price} onChange={(v) => updateForm("price", v)} />
              <AdminInput label="Endirim qiyməti" type="number" value={form.discountPrice} onChange={(v) => updateForm("discountPrice", v)} />

              <AdminSelect label="Kateqoriya" value={form.categoryId} onChange={(v) => updateForm("categoryId", v)}>
                <option value="">Kateqoriya seç</option>
                {categories.map((category) => (
                  <option key={getOptionId(category)} value={getOptionId(category)}>
                    {getCategoryName(category) || "Adsız kateqoriya"}
                  </option>
                ))}
              </AdminSelect>

              <AdminSelect label="Brend" value={form.brandId} onChange={(v) => updateForm("brandId", v)}>
                <option value="">Brend seç</option>
                {brands.map((brand) => (
                  <option key={getOptionId(brand)} value={getOptionId(brand)}>
                    {getBrandName(brand) || "Adsız brend"}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Açıqlama
              </span>

              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={5}
                className="w-full resize-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Görünmə
            </h2>

            <div className="space-y-4">
              <ToggleRow title="Endirimli məhsul" checked={form.isDiscounted} onChange={() => updateForm("isDiscounted", !form.isDiscounted)} />
              <ToggleRow title="Önə çıxan məhsul" checked={form.isFeatured} onChange={() => updateForm("isFeatured", !form.isFeatured)} />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Variantlar
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  Ölçü, rəng və stok əlaqələri.
                </p>
              </div>

              <button type="button" onClick={addVariant} className="flex h-11 items-center gap-2 rounded-[15px] bg-[#244989] px-4 text-sm font-extrabold text-white">
                <FiPlus />
                Variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id || index} className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-extrabold text-zinc-950">Variant #{index + 1}</h3>

                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(index)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600">
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <AdminSelect label="Ölçü" value={variant.sizeId} onChange={(v) => updateVariant(index, "sizeId", v)}>
                      <option value="">Ölçü seç</option>
                      {sizes.map((size) => (
                        <option key={getOptionId(size)} value={getOptionId(size)}>
                          {getSizeText(size)}
                        </option>
                      ))}
                    </AdminSelect>

                    <AdminSelect label="Rəng" value={variant.colorId} onChange={(v) => updateVariant(index, "colorId", v)}>
                      <option value="">Rəng seç</option>
                      {colors.map((color) => (
                        <option key={getOptionId(color)} value={getOptionId(color)}>
                          {getColorText(color)}
                        </option>
                      ))}
                    </AdminSelect>

                    <AdminInput label="Stok" type="number" value={variant.stockCount} onChange={(v) => updateVariant(index, "stockCount", v)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Mövcud şəkillər
            </h2>

            <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
              <div className="grid min-h-[340px] place-items-center overflow-hidden rounded-[28px] bg-zinc-50">
                {selectedImage ? (
                  <img src={selectedImage} alt={form.name} className="h-full max-h-[520px] w-full object-contain p-4" />
                ) : (
                  <FiImage className="text-[44px] text-zinc-300" />
                )}
              </div>

              <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
                {oldImages.map((image, index) => (
                  <div
                    key={image.id || image.imageUrl}
                    draggable={Boolean(image.id)}
                    onDragStart={() => setOldDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleOldImageDrop(index)}
                    className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-2"
                  >
                    <button type="button" onClick={() => setSelectedImage(image.imageUrl)} className="h-28 w-full overflow-hidden rounded-[18px] bg-white">
                      <img src={image.imageUrl} alt={form.name} className="h-full w-full object-cover" />
                    </button>

                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => setMainImage(image)} className="h-9 flex-1 rounded-[13px] bg-white text-xs font-extrabold text-[#244989]">
                        Əsas et
                      </button>

                      <button type="button" onClick={() => deleteOldImage(image)} className="grid h-9 w-9 place-items-center rounded-[13px] bg-red-50 text-red-600">
                        <FiTrash2 />
                      </button>
                    </div>

                    <p className="mt-2 text-center text-[11px] font-extrabold text-zinc-400">
                      Sıra: {index + 1}
                    </p>
                  </div>
                ))}

                {oldImages.length === 0 && (
                  <div className="rounded-[20px] bg-zinc-50 p-5 text-sm font-extrabold text-zinc-400">
                    Mövcud şəkil yoxdur.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Yeni şəkil əlavə et
            </h2>

            <label className="block cursor-pointer rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-zinc-400">
              <FiUploadCloud className="mx-auto text-[34px] text-zinc-400" />
              <p className="mt-3 text-sm font-extrabold text-zinc-700">
                Yeni şəkilləri seç
              </p>
              <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {newImages.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => setNewDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleNewImageDrop(index)}
                  className="relative overflow-hidden rounded-[20px] bg-zinc-50"
                >
                  <img src={image.preview} alt="Yeni məhsul şəkli" className="h-36 w-full object-cover" />

                  <div className="absolute left-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-zinc-700">
                    Yeni {index + 1}
                  </div>

                  <button type="button" onClick={() => removeNewImage(image.id)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-red-600">
                    <FiX />
                  </button>
                </div>
              ))}

              {newImages.length === 0 && (
                <div className="col-span-full rounded-[20px] bg-zinc-50 p-5 text-center text-sm font-extrabold text-zinc-400">
                  Yeni şəkil seçilməyib.
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-[28px] bg-zinc-950 p-5 text-white">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Məhsul xülasəsi
            </h2>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <SideRow label="Ad" value={form.name || "—"} />
              <SideRow label="Kod" value={form.productCode || "—"} />
              <SideRow label="Model" value={form.model || "—"} />
              <SideRow label="Qiymət" value={form.price ? `${form.price} ₼` : "—"} />
              <SideRow label="Endirim" value={form.discountPrice ? `${form.discountPrice} ₼` : "Yoxdur"} />
              <SideRow label="Kateqoriya" value={getCategoryName(selectedCategory) || "Seçilməyib"} />
              <SideRow label="Brend" value={getBrandName(selectedBrand) || "Seçilməyib"} />
              <SideRow label="Şəkil sayı" value={oldImages.length + newImages.length} />
            </div>
          </section>

          <button type="submit" className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
            <FiSave />
            Məhsulu yenilə
          </button>
        </aside>
      </form>
    </div>
  );
}

function AdminInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400" />
    </label>
  );
}

function AdminSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400">
        {children}
      </select>
    </label>
  );
}

function ToggleRow({ title, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left transition ${checked ? "border-[#244989] bg-[#244989]/8" : "border-zinc-100 bg-zinc-50"}`}>
      <span className="text-sm font-extrabold text-zinc-900">{title}</span>
      <span className={`h-6 w-11 rounded-full p-1 transition ${checked ? "bg-[#244989]" : "bg-zinc-300"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function SideRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/60">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
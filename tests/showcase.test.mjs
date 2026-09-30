import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME_PAGE_SIZE, hasNextHomePage, showcaseAfterProduct, showcaseHref, toShowcaseFormData } from "../src/utils/showcase.js";

test("load more ends at exact page boundaries using API totals", () => {
  assert.equal(hasNextHomePage({ data: { totalCount: 40 } }, 40, 1), false);
  assert.equal(hasNextHomePage({ data: { totalPages: 2 } }, 40, 1), true);
  assert.equal(hasNextHomePage({ data: { totalPages: 2 } }, 40, 2), false);
  assert.equal(hasNextHomePage([], 5, 3), false);
});

test("40 initial products contain only the first two grouped placements", () => {
  const groups = [{ id: "a", blocks: [1, 2, 3] }, { id: "b", blocks: [4, 5] }, { id: "c" }];
  const positions = Array.from({ length: HOME_PAGE_SIZE }, (_, i) => [i + 1, showcaseAfterProduct(groups, i + 1)]).filter(([, group]) => group);
  assert.deepEqual(positions.map(([count, group]) => [count, group.id]), [[15, "a"], [30, "b"]]);
  assert.equal(showcaseAfterProduct(groups, 45).id, "c");
  assert.equal(showcaseAfterProduct(groups, 60), null);
  assert.equal(showcaseAfterProduct([], 15), null);
});

test("noninteractive and unsafe links do not create a discover CTA", () => {
  for (const externalUrl of ["javascript:alert(1)", "data:text/html,hi", "//evil.test", "https://user:pass@example.com", "https://example.com/\nfoo"]) {
    assert.equal(showcaseHref({ targetType: "external", externalUrl }), null);
  }
  assert.equal(showcaseHref({ targetType: "none", slug: "old-slug", externalUrl: "https://example.com" }), null);
  assert.equal(showcaseHref({ targetType: "internal", slug: "foo/bar" }), null);
  assert.equal(showcaseHref({ targetType: "internal", slug: "birbankodeniskecidi" }), "/birbankodeniskecidi");
  assert.equal(showcaseHref({ targetType: "external", externalUrl: "https://example.com/path" }), "https://example.com/path");
});

test("multipart edit preserves IDs, concurrency version, ordered products and paired images", () => {
  const file = new Blob(["image"], { type: "image/jpeg" });
  const body = toShowcaseFormData({ name: "Group", displayOrder: 2, isActive: false, version: "v1", blocks: [
    { id: "block-2", targetType: "internal", productIds: ["p2", "p1"], file, mobileFile: file },
    { id: "block-1", targetType: "none", productIds: [] },
  ] });
  assert.equal(body.get("isActive"), "false");
  assert.equal(body.get("version"), "v1");
  assert.equal(body.get("blocks[0].id"), "block-2");
  assert.equal(body.get("blocks[0].productIds[1]"), "p1");
  assert.equal(body.get("blocks[0].file").size, 5);
  assert.equal(body.get("blocks[0].mobileFile").size, 5);
  assert.equal(body.get("blocks[1].file"), null);
});

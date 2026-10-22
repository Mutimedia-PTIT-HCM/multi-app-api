-- Chuẩn hoá storage key cho data import từ legacy.
-- Legacy lưu bare filename + URL build với prefix cố định:
--   sinhvien.avt            → /avt/<file>
--   anpham.hinhanh          → /products/<maanpham>/<file> (space-separated)
--   sukien.thumb            → /event/thumb/<file>
--   thongbao.list_file_name → /notification/<file> (space-separated)
-- Upload mới đã lưu full key ("avt/x.png", "products/y.jpg" — luôn chứa "/"),
-- nên chỉ rewrite các value chưa có "/" (tức data import từ legacy).

UPDATE students
SET avatarKey = CONCAT('avt/', TRIM(avatarKey))
WHERE avatarKey IS NOT NULL
  AND TRIM(avatarKey) != ''
  AND avatarKey NOT LIKE '%/%';

UPDATE events
SET thumbnailKey = CONCAT('event/thumb/', TRIM(thumbnailKey))
WHERE thumbnailKey IS NOT NULL
  AND TRIM(thumbnailKey) != ''
  AND thumbnailKey NOT LIKE '%/%';

UPDATE notifications
SET fileKeys = CONCAT(
      'notification/',
      REPLACE(TRIM(fileKeys), ' ', ' notification/')
    )
WHERE fileKeys IS NOT NULL
  AND TRIM(fileKeys) != ''
  AND fileKeys NOT LIKE '%/%';

UPDATE products
SET imageKeys = CONCAT(
      CONCAT('products/', productCode, '/'),
      REPLACE(TRIM(imageKeys), ' ', CONCAT(' products/', productCode, '/'))
    )
WHERE TRIM(imageKeys) != ''
  AND imageKeys NOT LIKE '%/%';

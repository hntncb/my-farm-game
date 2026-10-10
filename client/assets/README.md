# Anh cho game

Bo file png vao dung ten va thu muc duoi day, khong can sua code.
File nao chua co thi game tu dung `no-image.png`.
Nen dung anh vuong 64x64 (trung voi kich thuoc mot o), nen trong suot.

```
assets/
  no-image.png                  anh thay the khi thieu (bat buoc phai co)
  crops/
    POTATO/
      SEEDED.png                hat giong
      SPROUT.png                nay mam
      GROWING.png               dang lon
      MATURE.png                chin
    TOMATO/
      SEEDED.png
      SPROUT.png
      GROWING.png
      MATURE.png
  items/                        icon trong kho do
    POTATO_SEED.png             hat khoai tay
    TOMATO_SEED.png             hat ca chua
    POTATO.png                  khoai tay
    TOMATO.png                  ca chua
    GRASS.png                   co
    BUG.png                     bo
```

Ten file viet HOA va dung chinh xac nhu tren (Linux phan biet hoa thuong).
Khi chay `npm run dev:client`, console cua trinh duyet liet ke cac anh con thieu.
Them file moi luc dang chay ma khong thay doi thi tai lai trang (hoac khoi dong lai Vite).

## Them loai cay hoac vat pham moi

1. Them ten vao kieu `CropType` / `ItemType` (hoac `GrowthState`) trong `packages/shared`.
2. Them ten do vao danh sach tuong ung o dau `ui/images.ts`; TypeScript se bao loi neu quen.
3. Bo anh vao thu muc tuong ung.

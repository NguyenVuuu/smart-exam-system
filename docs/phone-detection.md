# Phat hien dien thoai trong ca thi

## Hanh vi

- Dung mot model `yolo11n-devices.onnx` da tinh chinh tu YOLO11n cho dien thoai va may tinh bang. Nhan COCO 67 duoc anh xa thanh `handheld device`. Phat hien du tin cay tao su kien tu frame dau tien; ung vien yeu can duoc xac nhan o ty le khac hoac tren ban giam sang cua cung frame.
- Moi lan dien thoai xuat hien tao mot su kien. Mot luot quet dien thoai day du khong con phat hien se ket thuc lan xuat hien do; lan xuat hien tiep theo duoc ghi nhan ngay, khong khoa 10 giay.
- Tao mot anh JPEG tu dung frame da phat hien, danh dau bounding box va timestamp ISO UTC tren anh. Upload duoc xep hang de khong bo qua su kien moi khi anh truoc dang gui.
- Chi upload anh khi co su kien. Cac frame inference chi di chuyen noi bo trinh duyet.
- Metadata: model, category, confidence, boundingBox (pixel tren frame goc khong lat guong), frameWidth, frameHeight, capturedAt, observedDurationMs.
- `PHONE_DETECTED` la tin hieu AI can giang vien xem anh va xac nhan; he thong khong tu ket luan gian lan hay tu buoc nop bai.
- Su kien dien thoai khong dong su kien khuon mat dang mo.

## Camera va Worker

`requestExamWebcam()` tai `exam-webcam.ts` giu mot active stream va mot pending promise, nen cac yeu cau dong thoi chi goi mot `getUserMedia`.

`StudentTakeExamPage` truyen cung `webcamStream` cho preview, live publisher va hai hook giam sat. Hai Worker `exam-face` va `exam-phone` xu ly doc lap, cung lay khung hinh tu stream da co va khong mo camera lan nua. YOLO chay cham khong chan nhan dien khuon mat.

Worker khuon mat dung MediaPipe Face Landmarker; Worker thiet bi dung mot model YOLO11n da tinh chinh. Moi Worker chi gui frame moi sau khi co ket qua frame truoc. Khoang lay frame muc tieu 80-150ms; thoi gian inference thuc te van gioi han toc do. Moi luot quet thiet bi xu ly khung hinh day du, sau do ghep bon goc vao mot anh de kiem tra ca bon goc trong cung frame bang mot lan inference bo sung. Vung nghi ngo co do tin cay thap duoc xac nhan o ty le khac hoac tren cung frame giam do sang 30%; khong doi them nhieu giay.

Truoc phone inference, Worker giu nguyen ti le camera va them vien den vao canvas vuong 640x640 (letterbox). Khong cat mat phan nao cua khung hinh. Bounding box duoc bo offset, chia scale va gioi han trong kich thuoc anh goc. Anh bang chung van la frame goc, khong co vien den. Face Landmarker van nhan frame goc.

Anh xem truoc bi thu nho trong giao dien khong du de danh gia chac chan mo hinh tren frame camera goc. Model nay duoc tinh chinh tu anh webcam dien thoai that, anh bang chung da duoc xem va gan nhan rieng cho dien thoai that/vo op rong/chai nuoc, anh am remote may lanh, va anh dien thoai/may tinh bang/may tinh cam tay/remote/chai tren Open Images. Truoc khi dung anh bang chung de hoc, can bo khung vang va timestamp; moi anh phai duoc xem lai de tranh dua dien thoai that vao nhom am. Anh rieng va manifest gan nhan nam ngoai repository. Kiem thu worker tren frame dau da phan biet op rong va chai nuoc voi dien thoai that o goc va dien thoai co op. Day la mau kiem thu nho, khong chung minh khong co nhan nham voi vat the, anh sang va camera khac. Tin hieu AI van can giang vien xem anh truoc khi xac nhan vi pham.

Face Landmarker thu GPU truoc va fallback CPU neu GPU loi; YOLO chay bang ONNX Runtime WASM. Neu Worker khong the tiep tuc, giao dien hien thong bao, live camera van hoat dong. Chi bat hook khi phase IN_PROGRESS va ca thi bat webcam; cleanup terminate Worker khi ket thuc. Tren Chromium headless thu nghiem, YOLO mat vai giay moi frame; khong the cam ket phat hien tuc thi voi cau hinh hien tai.

Classic Worker duoc dung de tuong thich `importScripts` cua MediaPipe WASM loader. `predev`/`prebuild` dong bo bundle va WASM tu package dang cai, khong tai CDN luc thi. Model nen YOLO11n co giay phep AGPL-3.0; can xem xet giay phep truoc khi phan phoi he thong. Chi tiet nguon model va du lieu xem `public/models/DEVICE_DETECTOR_LICENSE.md`.

Script `fe/soes-fe/scripts/train-device-detector.py` tai anh cong khai, gan nhan anh webcam va tinh chinh model. Anh webcam va tap tam nam ngoai repository. Script can Python voi Ultralytics va Pillow, tham so `--samples-dir`, `--negative-samples-dir`, `--positive-manifest`, `--work-dir`, `--model`, `--unified-class 67`, `--learning-rate`. Thu muc am chi chua anh da xac nhan khong co dien thoai/may tinh bang. Manifest duong chua danh sach JSON `{ "image": "...", "box": [x1, y1, x2, y2] }` cua anh dien thoai that da gan nhan. Script tao bien the lat va sang/toi cho anh cuc bo. Sau khi train can danh gia dong thoi anh am va anh dien thoai giu rieng, roi xuat ONNX 640x640 truoc khi thay model dang chay.

## Chuan bi chay

Tai `be/soes-be`, ap dung migration tren database can test, roi khoi dong lai backend:

```sh
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Migration moi: `20260922110000_add_phone_detection`. Lenh migrate deploy cung ap dung cac migration dang cho khac trong repository. Migration chua duoc tu dong ap dung trong qua trinh trien khai nay.

Tai `fe/soes-fe`:

```sh
npm install
npm run dev
```

Can co `public/models/face_landmarker.task`, `public/models/yolo11n-devices.onnx` va cac asset trong `public/yolo`. Khi deploy, dua model va asset WASM vao ban phat hanh. Su dung localhost hoac HTTPS de truy cap camera. Neu doi cong frontend, them dung origin vao ALLOWED_ORIGINS cua backend va khoi dong lai backend.

## Test tren giao dien

1. Giang vien tao/chon ca thi co bat webcam. Dung tai khoan sinh vien trong trinh duyet/profile khac va bat dau lam bai. Tai khoan giang vien mo trang giam sat truc tiep cua ca thi.
2. Cho tai xong model. Giu dien thoai ro rang, du sang truoc camera. Trong nhat ky giang vien se xuat hien "Phat hien dien thoai", trang thai "Chua xem" va confidence neu model nhan duoc.
3. Bam "Xem anh": anh phai co dien thoai va timestamp UTC. Doi chieu voi thoi gian su kien tren giao dien (hien thi theo mui gio cua ung dung).
4. Giu dien thoai trong khung hinh: mot lan xuat hien lien tuc chi tao mot su kien.
5. Cat dien thoai sau mot su kien, de worker quet duoc it nhat mot frame khong co dien thoai, roi dua vao lai: su kien moi co the duoc tao ngay neu model nhan duoc.
6. Thu khong mat, nhieu mat va nhin lech nhu truoc. Su kien dien thoai khong thay the hoac dong su kien khuon mat.
7. Giang vien mo xem live camera trong khi detector chay: chi mot lan xin quyen camera, video van hien thi. Co the kiem tra DevTools > Sources > Threads co hai Worker `exam-face` va `exam-phone`.
8. Nop bai: hai Worker bien mat, khong con inference/upload tu hook. Truoc khi bat dau bai thi cung khong co Worker vision.
9. DevTools > Network: cac request POST `violations` chi xuat hien khi co su kien; multipart chua mot file evidence va JSON metadata, khong gui tung frame len server. Neu mat mang/upload loi, giao dien camera hien thong bao; lan phat hien tiep theo se thu gui anh moi.
10. Giang vien co the danh dau da xem/bo qua/xac nhan sau khi xem bang chung. Phat hien tu dong khong tu chuyen sang CONFIRMED.

## Kiem tra tu dong

De chan doan khi khong co su kien, tai Console cua trang sinh vien chay:

```js
localStorage.setItem('soes:vision-debug', '1')
location.reload()
```

Loc Console theo `[exam-vision]`. `not-detected` nghia la khong co ung vien dien thoai; `below-threshold` la ung vien chua du tin cay; `first-frame` la da phat hien; `same-appearance` la dien thoai van con trong khung. `phone event saved` kem id xac nhan API da luu; `phone upload failed` la loi gui/luu su kien. Neu da saved ma giang vien chua thay, tai lai nhat ky va bo bo loc loai su kien. Log chi bat khi co co debug, khong gui frame them len server.

Tat log bang `localStorage.removeItem('soes:vision-debug')` roi tai lai trang. Anh chup preview khong cho biet confidence model; can ket qua debug de phan biet loi nhan dien va loi upload.

Tai frontend:

```sh
npm run test:vision
npm run build
npx playwright install chromium
# Can Vite dang chay; mac dinh test truy cap http://127.0.0.1:5174
npm run test:vision:browser
```

Co the dat `VISION_TEST_URL` de dung cong Vite khac. Unit test dung ket qua model gia lap de kiem tra nguong, su kien xuat hien lai va fallback. Browser test nap mot model thiet bi va model khuon mat tren frame rong, kiem tra GPU/CPU, mot getUserMedia, vong doi hook va bang nhat ky voi du lieu mau. Chung khong thay the test dien thoai vat ly tren webcam that.

De chay them hai regression test model that voi anh dien thoai rieng, dat `VISION_TEST_IMAGE` thanh duong dan tuyet doi cua anh truoc khi chay Playwright. Hai test nay mac dinh skip khi khong co bien nay. Anh rieng khong duoc commit vao repository. Co the dat `VISION_TEST_FRAMES=1` de kiem tra bat ngay o frame dau; `VISION_TEST_EXPECT_NONE=1` de kiem tra anh khong co thiet bi. Vi du PowerShell:

```powershell
$env:VISION_TEST_IMAGE = 'D:/path/to/phone-reference.jpg'
npx playwright test --grep 'reference photo'
```

Tai backend:

```sh
npm run build
node --test dist/modules/student-take-exam/validators/phone-detection.test.js
```

Chua kiem tra end-to-end database/object storage voi tai khoan thi that. Build co canh bao bundle lon; lint `StudentTakeExamPage.tsx` co loi setState-trong-effect da ton tai o phan lastSavedAt.

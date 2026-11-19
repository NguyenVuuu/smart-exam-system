# Phat hien dien thoai trong ca thi

## Hanh vi

- Dung EfficientDet-Lite0, chi lay nhan `cell phone`. Phat hien du tin cay tao su kien ngay o frame dau tien; ung vien yeu can duoc xac nhan bang lan nhin khac tren cung frame.
- Moi lan dien thoai xuat hien tao mot su kien. Mot luot quet dien thoai day du khong con phat hien se ket thuc lan xuat hien do; lan xuat hien tiep theo duoc ghi nhan ngay, khong khoa 10 giay.
- Tao mot anh JPEG tu dung frame da phat hien, danh dau bounding box va timestamp ISO UTC tren anh. Upload duoc xep hang de khong bo qua su kien moi khi anh truoc dang gui.
- Chi upload anh khi co su kien. Cac frame inference chi di chuyen noi bo trinh duyet.
- Metadata: model, category, confidence, boundingBox (pixel tren frame goc khong lat guong), frameWidth, frameHeight, capturedAt, observedDurationMs.
- `PHONE_DETECTED` la tin hieu AI can giang vien xem anh va xac nhan; he thong khong tu ket luan gian lan hay tu buoc nop bai.
- Su kien dien thoai khong dong su kien khuon mat dang mo.

## Camera va Worker

`requestExamWebcam()` tai `exam-webcam.ts` giu mot active stream va mot pending promise, nen cac yeu cau dong thoi chi goi mot `getUserMedia`.

`StudentTakeExamPage` truyen cung `webcamStream` cho preview, live publisher va `useWebcamViolationMonitor`. Hook tao video tu stream nay, gui ImageBitmap vao mot classic Worker `exam-vision`. Worker khong mo camera.

Worker chay Face Landmarker va Object Detector xen ke, dong thoi kiem tra nhanh dien thoai tren frame xu ly khuon mat neu chua co su kien dang hien dien. Chi gui frame moi sau khi co ket qua frame truoc. Khoang lay frame muc tieu 80-150ms; thoi gian inference thuc te van gioi han toc do. Moi luot quet day du chi xu ly hai vung goc, uu tien goc duoi ben phai va luan phien cac goc khac.

Truoc phone inference, Worker giu nguyen ti le camera va them vien den vao canvas vuong 720x720 (letterbox). Khong cat mat phan nao cua khung hinh. Model van xu ly o kich thuoc native cua no. Bounding box duoc bo offset, chia scale va gioi han trong kich thuoc anh goc. Anh bang chung van la frame goc, khong co vien den. Face Landmarker van nhan frame goc.

Anh xem truoc bi thu nho trong giao dien khong du de danh gia chac chan mo hinh tren frame camera goc. Kiem tra voi anh xem truoc co dien thoai chi lo mot goc va anh khong co dien thoai cho diem du doan rat gan nhau; ha nguong se tang bao nham. Can thu nghiem tren frame camera goc va tap anh gom nhieu loai dien thoai, op lung, anh sang va goc che khuat truoc khi thay mo hinh hoac nguong nhan dien.

Ca hai model thu GPU truoc, fallback CPU/WASM khi khoi tao hoac inference GPU loi. Neu Worker khong the tiep tuc, giao dien hien thong bao, live camera van hoat dong. Chi bat hook khi phase IN_PROGRESS va ca thi bat webcam; cleanup terminate Worker khi ket thuc.

Classic Worker duoc dung de tuong thich `importScripts` cua MediaPipe WASM loader. `predev`/`prebuild` dong bo bundle va WASM tu package dang cai, khong tai CDN luc thi. Tai lieu: https://developers.google.com/edge/mediapipe/solutions/vision/object_detector/web_js

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

Can co hai file `public/models/face_landmarker.task` va `public/models/efficientdet_lite0.tflite`. Khi deploy, dua ca file model dien thoai vao ban phat hanh. Su dung localhost hoac HTTPS de truy cap camera. Neu doi cong frontend, them dung origin vao ALLOWED_ORIGINS cua backend.

## Test tren giao dien

1. Giang vien tao/chon ca thi co bat webcam. Dung tai khoan sinh vien trong trinh duyet/profile khac va bat dau lam bai. Tai khoan giang vien mo trang giam sat truc tiep cua ca thi.
2. Cho tai xong model. Giu dien thoai ro rang, du sang, khong che mat truoc camera trong 3-5 giay. Trong nhat ky giang vien se xuat hien "Phat hien dien thoai", trang thai "Chua xem" va confidence.
3. Bam "Xem anh": anh phai co dien thoai va timestamp UTC. Doi chieu voi thoi gian su kien tren giao dien (hien thi theo mui gio cua ung dung).
4. Giu dien thoai trong khung hinh: khong co anh moi trong 10 giay cooldown; sau do co mot su kien/anh moi neu van phat hien.
5. Dua dien thoai vao duoi 3 giay roi cat di: khong co su kien. Cat dien thoai sau mot su kien: khong lap lai khi khong thay. Dua vao lai: phai du 3 giay va het cooldown.
6. Thu khong mat, nhieu mat va nhin lech nhu truoc. Su kien dien thoai khong thay the hoac dong su kien khuon mat.
7. Giang vien mo xem live camera trong khi detector chay: chi mot lan xin quyen camera, video van hien thi. Co the kiem tra DevTools > Sources > Threads co mot `exam-vision` Worker.
8. Nop bai: Worker bien mat, khong con inference/upload tu hook. Truoc khi bat dau bai thi cung khong co Worker vision.
9. DevTools > Network: cac request POST `violations` chi xuat hien khi co su kien; multipart chua mot file evidence va JSON metadata, khong gui tung frame len server. Neu mat mang/upload loi, giao dien camera hien thong bao; lan phat hien tiep theo se thu gui anh moi.
10. Giang vien co the danh dau da xem/bo qua/xac nhan sau khi xem bang chung. Phat hien tu dong khong tu chuyen sang CONFIRMED.

## Kiem tra tu dong

De chan doan khi khong co su kien, tai Console cua trang sinh vien chay:

```js
localStorage.setItem('soes:vision-debug', '1')
location.reload()
```

Loc Console theo `[exam-vision]`. `not-detected` nghia la chua co ung vien dien thoai >= 0.25; `below-threshold` la chua dat 0.5; `confirming` kem `positiveMs` la dang tich luy; `cooldown` la dang cho. `phone event saved` kem id xac nhan API da luu; `phone upload failed` la loi gui/luu su kien. Neu da saved ma giang vien chua thay, tai lai nhat ky va bo bo loc loai su kien. Log chi bat khi co co debug, khong gui frame them len server.

Tat log bang `localStorage.removeItem('soes:vision-debug')` roi tai lai trang. Anh chup preview khong cho biet confidence model; can ket qua debug de phan biet loi nhan dien va loi upload.

Tai frontend:

```sh
npm run test:vision
npm run build
npx playwright install chromium
# Can Vite dang chay; mac dinh test truy cap http://127.0.0.1:5174
npm run test:vision:browser
```

Co the dat `VISION_TEST_URL` de dung cong Vite khac. Unit test dung ket qua model gia lap de kiem tra nguong, cooldown va fallback. Browser test nap hai model that tren frame rong, kiem tra GPU/CPU, mot getUserMedia, vong doi hook va bang nhat ky voi du lieu mau. Chung khong thay the test dien thoai vat ly tren webcam that.

De chay them hai regression test model that voi anh dien thoai rieng, dat `VISION_TEST_IMAGE` thanh duong dan tuyet doi cua anh truoc khi chay Playwright. Hai test nay mac dinh skip khi khong co bien nay. Anh rieng khong duoc commit vao repository. Vi du PowerShell:

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

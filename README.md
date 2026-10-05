# HUGAMEX company website

Website doanh nghiệp VI/EN và CMS: React 19, TypeScript, Vite; Java 21, Spring Boot 3.5; PostgreSQL 17. Trình duyệt chỉ gọi Spring REST. Media được lưu bằng PostgreSQL BYTEA.

## Chạy local

Yêu cầu: Node >=20.19, npm, Java 21, Maven, Docker Desktop đang chạy. Mở terminal ở thư mục `hugamex-company-website`.

Chỉ ở lần thiết lập đầu tiên:

```sh
python3 scripts/setup-local.py
docker compose up -d postgres
cd frontend
npm ci
cd ..
```

Script tạo khóa và mật khẩu DB ngẫu nhiên vào `.env` và `backend/.env`, quyền tệp 0600. Script giữ nguyên môi trường đã có. Không chạy lại để thay khóa đang sử dụng.

Terminal backend:

```sh
bash scripts/backend.sh spring-boot:run
```

Terminal frontend:

```sh
cd frontend
npm run dev
```

Mở `http://127.0.0.1:5173` hoặc `http://localhost:5173`. Backend `http://127.0.0.1:8080`; Swagger dev `http://127.0.0.1:8080/swagger-ui/index.html`. Để frontend gọi API cùng origin, dùng Vite proxy mặc định. Không cần Google/Supabase để xem local.

`compose.yml` chỉ chạy PostgreSQL local; không deploy. Dữ liệu giữ trong Docker volume. Không dùng `docker compose down -v` nếu còn cần dữ liệu.

## Truy cập CMS và tài khoản

Local hiện có tài khoản SUPER_ADMIN phục vụ kiểm thử. Thông tin truy cập nằm trong tệp riêng tư **`.local/e2e.json`**: email, password, secret TOTP và mã khôi phục còn lại. Mở tệp trên máy của bạn; không gửi hoặc commit tệp này. Dùng ứng dụng Authenticator với khóa `secret`, hoặc một recovery code chưa dùng. Sau khi dùng mã bằng tay, xóa nó khỏi danh sách fixture trước lần chạy test tiếp theo. Đây là tài khoản local, không sử dụng cho production.

Đăng nhập `/dang-nhap` → Tài khoản → CMS / Admin → MFA → `/admin`. Nội dung ảnh và bản dịch đều sửa được tại CMS. Có thể tạo người dùng EDITOR để viết bài. Người dùng được mời cần xác thực email và dùng Quên mật khẩu để đặt mật khẩu riêng.

Ở database mới chưa có SUPER_ADMIN: điền `BOOTSTRAP_ADMIN_EMAIL` và một passphrase riêng ít nhất 12 ký tự trong `backend/.env`, khởi động backend một lần, sau đó xóa hai giá trị này và khởi động lại. Bootstrap không tạo thêm admin khi đã có SUPER_ADMIN đang hoạt động. Không có mật khẩu mặc định.

Dev mail ghi vào `backend/.dev-mail/<challengeId>.txt`, quyền 0600, thư mục 0700. Đây là OTP thật của môi trường local, không in ra log và không gửi SMTP. `challengeId` xuất hiện trên màn hình xác thực. OTP hết hạn sau 5 phút, tối đa 5 lần thử, gửi lại sau 60 giây.

## CMS

- Bài viết, danh mục, trang nội dung: tạo nháp, VI/EN, TipTap, ảnh nổi bật, SEO, preview, xuất bản, chuyển nháp hoặc lưu trữ.
- Nhà máy/văn phòng, sản phẩm, đối tác, chứng nhận, hero: quản lý qua các mục tương ứng.
- Trang chủ: bật/tắt, thứ tự, tiêu đề/mô tả hai ngôn ngữ và chọn nội dung đã xuất bản. Hero có điều khiển chuyển slide.
- Media: upload, alt text, public/private, tải xuống, chỉnh sửa và xóa có kiểm tra tham chiếu. PDF và ảnh JPEG/PNG/WebP được phép.
- Liên hệ: xem nội dung và đổi NEW/READ/REPLIED/ARCHIVED. Không tự gửi email phản hồi.
- Người dùng: mời, kích hoạt/vô hiệu hóa; SUPER_ADMIN quản role và reset MFA. Nhật ký và cài đặt website thuộc SUPER_ADMIN.

ADMIN/SUPER_ADMIN phải bật MFA. EDITOR có thể bật MFA; khi đã bật thì phải xác thực để vào CMS. Mã khôi phục được tạo lại trong Tài khoản sau lần đăng nhập gần đây. Thay role/status/mật khẩu hoặc reset MFA thu hồi các phiên liên quan.

## Kiểm thử và build

```sh
bash scripts/backend.sh spotless:apply
bash scripts/test-backend.sh
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
npm audit
npm run test:e2e
```

Testcontainers dùng một PostgreSQL riêng, không ghi vào DB local của website. Playwright cần backend local đang chạy; reuse Vite hiện có hoặc tự khởi động nó. Browser cài riêng trong `.tools/playwright`:

```sh
cd frontend
PLAYWRIGHT_BROWSERS_PATH=../.tools/playwright npx playwright install chromium
```

Để dựng fixture QA trên checkout/database mới: chạy `python3 scripts/prepare-e2e.py` trước khi backend khởi động lần đầu; chỉ sử dụng dev. Chạy suite để thiết lập MFA fixture. Xóa biến bootstrap khỏi `backend/.env` sau khi tài khoản đã được tạo. Dữ liệu minh họa có thể tạo bằng `node scripts/seed-dev-content.mjs` ở root sau đó. Script chỉ gọi API localhost trong profile dev, cần fixture đã có MFA, đánh dấu nội dung chờ doanh nghiệp duyệt.

Lighthouse chạy riêng trong `.tools/lighthouse`, không thuộc dependency ứng dụng. Xem giới hạn và cách chạy tại [báo cáo kiểm thử](docs/TEST_REPORT.md).

## Cấu hình cần cung cấp sau

`backend/.env.example` và `frontend/.env.example` là mẫu, không chứa secret. Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`. Supabase: JDBC `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`; dùng kết nối SSL và tài khoản backend riêng. Frontend không dùng Supabase SDK hay service-role key.

Production còn cần bốn khóa 32-byte Base64 độc lập (`JWT_SIGNING_KEY`, `TOKEN_HASH_KEY`, `OTP_HMAC_KEY`, `MFA_ENCRYPTION_KEY`), SMTP, domain HTTPS, CORS chính xác và `VITE_SITE_URL`. Không dùng lại secret/QA account local.

Ảnh stock, số liệu, lịch sử, chứng nhận, đối tác, liên hệ và chính sách bảo mật đang chờ phê duyệt. Đọc [nội dung](docs/CONTENT_INVENTORY.md), [asset](docs/ASSETS.md), [security review](docs/SECURITY_REVIEW.md), [kế hoạch production](docs/DEPLOYMENT_PLAN.md) và [báo cáo bàn giao](docs/FINAL_REPORT.md).

Chưa deploy, chưa đổi DNS, chưa kết nối Google/Supabase/SMTP thật. Kết quả local không thay thế kiểm thử cấu hình production.

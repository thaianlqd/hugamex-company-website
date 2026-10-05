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

Terminal frontend khách hàng:

```sh
cd frontend
npm run dev
```

Terminal frontend admin riêng:

```sh
cd frontend
npm run dev:admin
```

Khách hàng: **http://localhost:5173**. Admin: **http://localhost:5180** (tự chuyển đến đăng nhập hoặc `/admin`). Backend `http://127.0.0.1:8080`; Swagger dev `http://127.0.0.1:8080/swagger-ui/index.html`. Hai Vite servers dùng chung Spring API qua proxy, khác cổng và bộ routes. `/admin/*` ở cổng khách hàng chuyển sang cổng admin; sau đăng nhập admin vào thẳng MFA/CMS. Cổng cố định với strictPort để không tự đổi URL nếu bị chiếm. 5174/5175 đang được Docker dùng trên máy này nên admin dùng 5180.

Đây là tách giao diện/origin, không thay thế RBAC/MFA backend. Cookie của cùng hostname vẫn dùng chung giữa các cổng. Hai bản build: `npm run build` → `dist/` và `npm run build:admin` → `dist-admin/`; khi chọn hosting sau này cần cấu hình `VITE_PUBLIC_URL` và `VITE_ADMIN_URL` bằng origins thực tế. Google/Supabase không bắt buộc để xem giao diện fallback; dữ liệu và đăng nhập cần backend/DB hoạt động.

`compose.yml` chỉ chạy PostgreSQL local; không deploy. Dữ liệu giữ trong Docker volume. Không dùng `docker compose down -v` nếu còn cần dữ liệu.

## Truy cập CMS và tài khoản

**Supabase hiện có SUPER_ADMIN thật đã tạo theo yêu cầu.** Email và mật khẩu ngẫu nhiên nằm trong tệp ignored `.local/supabase-admin.json` (0600). Mở tệp trên máy để lấy thông tin, đăng nhập cổng **5180** → Thiết lập ứng dụng xác thực → thêm khóa vào Authenticator → nhập TOTP → lưu mã khôi phục. Chưa thiết lập MFA thì không vào được CMS. Không gửi/commit tệp credentials. Bootstrap env đã được xóa sau khi xác nhận tạo tài khoản và đăng nhập thành công. Không dùng credentials QA Docker cho tài khoản này.

Database Docker local có tài khoản SUPER_ADMIN phục vụ kiểm thử. Thông tin truy cập nằm trong tệp riêng tư **`.local/e2e.json`**: email, password, secret TOTP và mã khôi phục còn lại. Mở tệp trên máy của bạn; không gửi hoặc commit tệp này. Dùng ứng dụng Authenticator với khóa `secret`, hoặc một recovery code chưa dùng. Sau khi dùng mã bằng tay, xóa nó khỏi danh sách fixture trước lần chạy test tiếp theo. Tài khoản này không tồn tại trên Supabase mới và không được copy sang đó.

Đăng nhập `/dang-nhap` → Tài khoản → CMS / Admin → MFA → `/admin`. Nội dung ảnh và bản dịch đều sửa được tại CMS. Có thể tạo người dùng EDITOR để viết bài. Người dùng được mời cần xác thực email và dùng Quên mật khẩu để đặt mật khẩu riêng.

Ở database mới chưa có SUPER_ADMIN: điền `BOOTSTRAP_ADMIN_EMAIL` và một passphrase riêng ít nhất 12 ký tự trong `backend/.env`, khởi động backend một lần, sau đó xóa hai giá trị này và khởi động lại. Bootstrap không tạo thêm admin khi đã có SUPER_ADMIN đang hoạt động. Không có mật khẩu mặc định.

Với `MAIL_MODE=file`, dev mail ghi vào `backend/.dev-mail/<challengeId>.txt`, quyền 0600, thư mục 0700. Chế độ này chỉ cho dev/test. Với `MAIL_MODE=smtp`, thư gửi qua SMTP trong cả dev hoặc prod, không tạo tệp OTP. OTP hết hạn sau 5 phút, tối đa 5 lần thử, gửi lại sau 60 giây. Không log OTP trong cả hai chế độ.

## Supabase + Gmail SMTP trong local development

Giữ `SPRING_PROFILES_ACTIVE=dev`. Chỉ chỉnh `backend/.env` riêng tư, không thay các khóa bảo mật đã có:

```dotenv
DATABASE_URL='jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require'
DATABASE_USERNAME=postgres.qhpdjefulinrwbcwqxfi
DATABASE_PASSWORD=''
MAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=''
MAIL_FROM=
```

Điền mật khẩu **database** Supabase, địa chỉ Gmail và **Google App Password mới** trực tiếp trong tệp. `MAIL_FROM` dùng cùng địa chỉ với `SMTP_USERNAME`. Đặt giá trị secret trong nháy đơn để tránh shell diễn giải ký tự đặc biệt; không gửi secret qua chat. Không dùng mật khẩu tài khoản Google thông thường. Backend bắt buộc STARTTLS, xác minh hostname SMTP và có timeout; thiếu cấu hình sẽ fail fast. `MAIL_MODE` thay thế tên cũ `DEV_MAIL_MODE`.

[Supabase Session Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres) dùng cổng 5432. `sslmode=require` bắt buộc mã hóa đường JDBC đến pooler; nó không tương đương xác minh đầy đủ chứng chỉ/hostname PostgreSQL, cần review `verify-full` và CA trước production. Cấu hình timeout email theo [Spring Boot email documentation](https://docs.spring.io/spring-boot/reference/io/email.html).

Chạy ở root:

```sh
bash scripts/verify-supabase.sh preflight
bash scripts/backend.sh spring-boot:run
```

Preflight chỉ SELECT, chặn bảng trùng tên chưa có Flyway history hoặc history của ứng dụng khác. Backend mới chạy Flyway V1–V4 và JPA validate. Trong terminal khác:

```sh
bash scripts/verify-supabase.sh postflight
```

Postflight kiểm tra 17 bảng, 4 migrations thành công, RLS, BYTEA và số SUPER_ADMIN; không đọc OTP/password và không ghi dữ liệu. Khởi động lại backend một lần để xác nhận Flyway không apply lại migration. Bootstrap chỉ khi chính bạn điền `BOOTSTRAP_ADMIN_EMAIL/PASSWORD`; để trống thì bỏ qua.

Không chạy `prepare-e2e.py`, `seed-dev-content.mjs` hoặc Playwright journeys trên Supabase. Hai helper QA có guard database Docker; `dev` không có nghĩa là database local. Không tự import nội dung hoặc credentials QA. `bash scripts/test-backend.sh` luôn dùng PostgreSQL Testcontainers và `MAIL_MODE=file`, không gửi Gmail thật.

Để kiểm tra thật: mở `/dang-ky`, dùng email nhận thư của bạn và tự đặt mật khẩu → kiểm tra inbox/nhập OTP → đăng nhập → quên mật khẩu → kiểm tra thư/nhập OTP → đặt mật khẩu mới → đăng nhập lại. Agent không đọc inbox hoặc yêu cầu bạn gửi OTP. Log chỉ ghi SMTP transport đã chấp nhận thư và mục đích; đó chưa phải xác nhận thư đã vào inbox. Google OAuth vẫn chưa cấu hình/test.

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
npm run build:admin
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

Production còn cần bốn khóa 32-byte Base64 độc lập (`JWT_SIGNING_KEY`, `TOKEN_HASH_KEY`, `OTP_HMAC_KEY`, `MFA_ENCRYPTION_KEY`), SMTP, domain HTTPS, CORS chính xác và `VITE_SITE_URL`, `VITE_PUBLIC_URL`, `VITE_ADMIN_URL`. Không dùng lại secret/QA account local.

Ảnh stock, số liệu, lịch sử, chứng nhận, đối tác, liên hệ và chính sách bảo mật đang chờ phê duyệt. Đọc [nội dung](docs/CONTENT_INVENTORY.md), [asset](docs/ASSETS.md), [security review](docs/SECURITY_REVIEW.md), [kế hoạch production](docs/DEPLOYMENT_PLAN.md) và [báo cáo bàn giao](docs/FINAL_REPORT.md).

Chưa deploy, chưa đổi DNS. Google OAuth vẫn chưa cấu hình/test. Trạng thái kết nối Supabase và Gmail SMTP thực tế được ghi riêng trong [báo cáo tích hợp](docs/SUPABASE_SMTP_REPORT.md). Kết quả local không thay thế kiểm thử cấu hình production.

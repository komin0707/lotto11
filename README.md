# Landing Only Repo

광고 제작 파일 없이, 랜딩 페이지와 결제 서버만 포함된 폴더입니다.

## 포함 파일
- `public/` : 랜딩 HTML/CSS/JS
- `payment-server.mjs` : 정적 파일 + 결제 승인 API 서버
- `package.json` : 실행 스크립트
- `.env.example` : 환경변수 샘플

## 로컬 실행
```bash
cd landing
TOSS_CLIENT_KEY="test_ck_xxx" TOSS_SECRET_KEY="test_sk_xxx" npm run start
```

접속:
- `http://localhost:5187/index.html`

## GitHub에 landing만 올리기
```bash
cd landing
git init
git add .
git commit -m "landing only"
git branch -M main
git remote add origin <새_깃허브_레포_URL>
git push -u origin main
```

## Render 배포 (선택)
- Root Directory: `landing` (모노레포에서 연결할 때)
- Build Command: 없음
- Start Command: `npm run start`
- Env:
  - `TOSS_CLIENT_KEY`
  - `TOSS_SECRET_KEY`
  - `PRODUCT_AMOUNT=990`

## Netlify 배포 (현재 권장 설정)
- Deploy 방식: Git 연동 배포 (단순 파일 드래그 업로드는 함수 미동작)
- Publish directory: `public`
- Functions directory: `netlify/functions` (`netlify.toml`에 포함됨)
- Environment variables:
  - `TOSS_CLIENT_KEY`
  - `TOSS_SECRET_KEY`
  - `PRODUCT_AMOUNT=990`

배포 후 확인:
- `https://도메인/api/payment/config` 접속 시 JSON 응답
- 결제 완료 후 `payment-success.html`에서 승인 완료 메시지 확인

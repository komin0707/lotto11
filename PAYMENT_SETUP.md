# 결제 구축 빠른 실행 가이드

## 1) 토스페이먼츠 키 준비
- `TOSS_CLIENT_KEY`: 공개 클라이언트 키 (test/prod)
- `TOSS_SECRET_KEY`: 서버 승인용 시크릿 키

## 2) 로컬 서버 실행
```bash
cd landing
TOSS_CLIENT_KEY="test_ck_Z1aOwX7K8my5wez79D1B8yQxzvNP" \
TOSS_SECRET_KEY="test_sk_xxx" \
npm run start
```

- 기본 주소: `http://localhost:5187`
- 랜딩 페이지: `http://localhost:5187/index.html`

## 3) 테스트 결제 동작
1. 랜딩에서 `990원으로 이번 달+다음 달 전체 보기` 버튼 클릭
2. 토스 결제창 진입
3. 결제 완료 시 `payment-success.html`로 이동
4. `POST /api/payment/confirm` 승인 완료 시 완료 상태 표시

## 4) 운영 전 체크
- `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`를 운영 키로 교체
- 도메인 HTTPS 적용
- 승인 성공 후 실제 결과 공개 로직(잠금 해제) 연결

## 5) Netlify 배포 시 필수
- Git 연동 배포를 사용해야 함수(`netlify/functions`)가 동작합니다.
- `netlify.toml`이 있으므로 아래만 맞추면 됩니다.
  - Publish directory: `public`
  - Functions directory: `netlify/functions`
  - Env: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `PRODUCT_AMOUNT`

배포 확인:
- `/api/payment/config` 호출이 200 JSON이면 정상

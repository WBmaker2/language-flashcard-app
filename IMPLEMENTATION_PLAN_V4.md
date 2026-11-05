# 언어 학습 플래시카드 — 구현 계획 v4 (추가 단계)

## 1. SRS 고도화
- 학습 단계(1m/10m), fuzz, overdue, Undo, 세션 리포트
- Review에 state/step/lastInterval 추가

## 2. 카드 타입 확장
- type: basic/input/mcq/cloze
- Study 입력/객관식/클로즈 채점

## 3. 덱 공유
- 메타데이터 포함 JSON + 공유 링크/QR (클라이언트 only)

## 4. 데이터 안정성
- Zod? (의존성 추가) 스키마 검증, 마이그레이션 테스트, 저장소 용량 경고

## 5. UX
- 대용량 덱 가상 스크롤, 오프라인 업데이트 토스트, PWA 설치 안내

## 6. 접근성/품질
- axe 테스트, 키보드 전체 흐름, 스크린리더 라벨

## 7. i18n + 테마 + 고급 통계
- ko/en, 다크/라이트, 히트맵/정착률

## 8. CI
- GitHub Actions test/build/deploy, Lighthouse CI

## 검증
- unit/e2e/a11y, build, lint

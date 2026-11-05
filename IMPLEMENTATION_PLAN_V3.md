# 언어 학습 플래시카드 — 구현 계획 v3 (다음 단계)

## 목표
v2 MVP 이후 품질/검증/배포/UX 보강.

## 1. 단위 테스트
- Vitest + @testing-library/react 도입
- SM-2 엔진(nextReview) 케이스: again/hard/good/easy, ease 하한 1.3, due 계산
- CSV 파서/직렬화 라운드트립
- IndexedDB 저장소 기본 CRUD (fake-indexeddb)

## 2. E2E 테스트
- Playwright: 덱 생성 → 카드 추가 → 학습 → 평가 → 완료 화면
- 가져오기/내보내기 스모크
- 오프라인 캐시 로드(서비스 워커)

## 3. 검색/필터/셔플/세션 목표
- DeckPage 카드 검색(앞/뒤/태그), 태그 필터
- Study 세션 셔플 옵션, dailyGoal 기반 세션 크기 제한
- due 카드 없을 때 전체 복습 옵션

## 4. PWA/오프라인/배포
- Lighthouse PWA 점검, manifest 아이콘/테마 보강
- base 경로 상대화('./')로 정적 호스팅 호환
- 서비스 워커 업데이트 토스트

## 5. 백업/복원/마이그레이션
- 전체 DB JSON 백업/복원
- Dexie 버전 마이그레이션 훅
- 오류 처리/토스트

## 6. 접근성/모바일
- 키보드 단축키(Space 뒤집기, 1-4 평가)
- 터치 스와이프 뒤집기
- prefers-reduced-motion 대응
- ARIA 라벨/포커스 관리

## 검증
- npm run test, npm run test:e2e, npm run build, lint

# 언어 학습 플래시카드 (Language Flashcard App) — 구현 계획 v2

## 1. 개요
오프라인 동작하는 다국어 플래시카드 앱. Web Speech API로 발음 재생.
간격 반복(SRS)으로 복습 최적화. API 없이 동작.

## 2. 목표 사용자
- 어학 학습자 (영어/일본어/중국어/스페인어 등)
- 교사(단어장 공유)

## 3. 핵심 기능
- 덱(단어장) 관리, 카드 CRUD
- 학습 모드: 앞/뒤 뒤집기, SRS 평가(again/hard/good/easy)
- 발음 재생 (Web Speech API, 언어별 voice)
- 이미지 첨부 (로컬 파일)
- 가져오기/내보내기 (CSV/JSON)
- 통계: 학습량, 연속일, 숙련도
- PWA: 오프라인 설치

## 4. 화면 구성
- 홈: 덱 목록 + 오늘 복습 수
- 학습: 카드 뷰, 평가 버튼
- 덱 관리: 카드 목록/편집
- 통계
- 설정: 언어/TTS voice

## 5. 기술 스택
- React + Vite + TypeScript (PWA via vite-plugin-pwa)
- 상태관리: Zustand + persist
- 저장: IndexedDB (Dexie)
- TTS: Web Speech API
- 차트: Recharts

## 6. 데이터 모델
- Deck { id, name, lang, cardCount }
- Card { id, deckId, front, back, image?, tags }
- Review { cardId, ease, interval, due, reps, lapses }
- Settings { voice, autoPlay, dailyGoal }

## 7. 구현 단계
1. 세팅 + PWA
2. 덱/카드 CRUD
3. 학습 뷰 + 뒤집기 애니메이션
4. SRS 엔진 (SM-2)
5. TTS 발음
6. 가져오기/내보내기
7. 통계 대시보드
8. 오프라인/설치 테스트

## 8. 비기능 요구사항
- PWA 오프라인
- 모바일 터치, 제스처

## 9. 검증
- 단위: SRS
- E2E: 학습 플로우
- Lighthouse PWA 점수

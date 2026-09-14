# ARCH QGate

**Project:** Nested Ordered Numbering  
**Project Baseline:** 0.0.0  
**Target Artifact:** `docs/ARCH.md`  
**Target Product Baseline:** `0.3.5@e6654beb615669173b108917f8e2b99d8d5b64db`  
**Status:** NOT RUN — independent Architecture Peer review pending  
**Prepared:** 2026-09-14

이 문서는 `docs/ARCH.md`의 실제 Architecture Quality Gate instance입니다. 현재 내용은 review target과 evidence 위치를 준비한 상태이며, original architecture 작업과 독립적인 reviewer의 최종 평가를 아직 받지 않았습니다. 따라서 PASS를 주장하지 않습니다.

## 0. Review Control
| 항목 | 값 |
|---|---|
| Project | Nested Ordered Numbering |
| Project Baseline | 0.0.0 |
| Target ARCH | `docs/ARCH.md` |
| Product source baseline | `0.3.5@e6654beb615669173b108917f8e2b99d8d5b64db` |
| Main restore commit | `dc8e5c2cd86ef7bb60d1f4179d3bb58ced250499` |
| SWE1 Baseline | 0.0.0 |
| Reviewer | TBD — independent Architecture Peer |
| Review Context Independence | REQUIRED; original persuasive chat/history should not be the sole basis |
| Review Date | TBD |

## 1. Score Legend
| 값 | 의미 |
|---|---|
| `2` | 충족. review 가능한 evidence 존재 |
| `1` | 부분 충족 / 일부 누락 |
| `0` | 미충족 또는 모순 |
| `N/A` | 적용 제외, rationale 필요 |
| `D` | Deferred. rationale + revisit trigger 필요; 0점 |

`M` = Mandatory, `A` = Advisory.

## 2. Chapter Evaluation

### 2.1. Introduction and Goals
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-01-01 | M | 제품 목적과 scope가 명확함 | - | ARCH §1 |
| QG-01-02 | M | functional drivers가 requirement와 연결됨 | - | ARCH §1.1, SWE1 REQ-F-* |
| QG-01-03 | M | quality goal이 구체적임 | - | ARCH §1.2, §10 |
| QG-01-04 | A | stakeholder/authority 식별 | - | ARCH §1.3 |

### 2.2. Constraints
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-02-01 | M | runtime/tool constraint 명확 | - | ARCH §2.1 |
| QG-02-02 | M | process/publication constraint 명확 | - | ARCH §2.2 |
| QG-02-03 | M | portability constraint 명확 | - | ARCH §2.3 |
| QG-02-04 | M | 충돌하는 요구가 disposition 됨 | - | ADR-009, RISK-003 |

### 2.3. Context and Scope
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-03-01 | M | system boundary 명확 | - | ARCH §3.1 |
| QG-03-02 | M | technical context 명확 | - | ARCH §3.2 |
| QG-03-03 | M | external interface 정의 | - | ARCH §3.3 |
| QG-03-04 | A | diagram과 prose가 일치 | - | ARCH §3 Mermaid + tables |

### 2.4. Solution Strategy
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-04-01 | M | strategy가 requirement/quality와 연결됨 | - | ARCH §4 |
| QG-04-02 | M | portable Markdown strategy rationale 존재 | - | STR-002, STR-005 |
| QG-04-03 | M | visual-alignment trade-off가 명시됨 | - | STR-005, ADR-009 |

### 2.5. Building Block View
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-05-01 | M | 주요 block 책임 정의 | - | ARCH §5 |
| QG-05-02 | M | dependency 방향 이해 가능 | - | ARCH §5 Mermaid |
| QG-05-03 | M | source repository 구조와 일치 | - | `src/main.ts`, `src/fenced-code-model.ts`, `src/model.ts` |

### 2.6. Runtime View
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-06-01 | M | Enter flow 정의 | - | ARCH §6.1 |
| QG-06-02 | M | Tab/Shift+Tab flow 정의 | - | ARCH §6.2 |
| QG-06-03 | M | fenced-code behavior 정의 | - | ARCH §6.3, product tests |
| QG-06-04 | M | atomic transaction behavior 명시 | - | ARCH §6, SWE1 REQ-Q-001 |

### 2.7. Deployment View
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-07-01 | M | build/release topology 정의 | - | ARCH §7 |
| QG-07-02 | M | install artifact mapping 정의 | - | `main.js`, `manifest.json`, `styles.css` |
| QG-07-03 | M | current stable release 식별 | - | release/tag 0.3.5 |
| QG-07-04 | A | documentation-only change release policy 명시 | - | ARCH §7 |

### 2.8. Cross-cutting Concepts
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-08-01 | M | numbering grammar/indentation 정책 | - | ARCH §8.1-8.2 |
| QG-08-02 | M | Markdown portability 정책 | - | ARCH §8.3, ADR-009 |
| QG-08-03 | M | security/privacy 정책 | - | ARCH §8.4 |
| QG-08-04 | M | recovery 정책 | - | ARCH §8.5 |

### 2.9. Architecture Decisions
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-09-01 | M | significant decisions have stable IDs | - | ADR-001~ADR-009 |
| QG-09-02 | M | decision rationale/trade-off 명확 | - | ARCH §9 |
| QG-09-03 | M | failed hanging-indent direction disposition | - | ADR-009, RISK-004 |

### 2.10. Quality Requirements
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-10-01 | M | measurable acceptance scenarios 존재 | - | ARCH §10 |
| QG-10-02 | M | fenced-code/no-op criterion 존재 | - | QS-004 |
| QG-10-03 | M | portability criterion 존재 | - | QS-006~QS-007 |

### 2.11. Risks and Technical Debt
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-11-01 | M | known architecture risks 기록 | - | RISK-001~RISK-004 |
| QG-11-02 | M | compound-prefix limitation disposition | - | RISK-003 |
| QG-11-03 | M | deferred item has revisit trigger | - | RISK-002, RISK-003 |

### 2.12. Glossary
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-12-01 | M | key domain terms defined | - | ARCH §12 |
| QG-12-02 | A | compound/root prefix disambiguated | - | ARCH §12 |

### 2.13. Agent Role and Orchestration View
| Item ID | R | Criterion | Score | Prepared Evidence |
|---|:---:|---|:---:|---|
| QG-13-01 | M | roles precede model assignment | - | ARCH §13 |
| QG-13-02 | M | authority/responsibility identified | - | ARCH §13 table |
| QG-13-03 | M | independent Architecture Peer required | - | ARCH §13, this QGate |
| QG-13-04 | M | private chat not required downstream | - | ARCH Baseline Handoff |

## 3. Gate Summary
| Metric | Result |
|---|---|
| Applicable Items | TBD by reviewer |
| Raw Score / Maximum | TBD |
| Overall Score | TBD |
| Mandatory Compliance | TBD |
| Critical Findings | TBD |
| Major Findings | TBD |
| Minor Findings | TBD |
| Gate Decision | **NOT RUN** |

## 4. Prepared Findings / Review Focus
These are review prompts, not final findings.

| Candidate ID | Area | Review Focus |
|---|---|---|
| CAND-001 | Portability | Confirm ADR-009 correctly treats compound-prefix hanging-indent as a Known Limitation rather than a defect |
| CAND-002 | Stability | Confirm product runtime/source at `main` is functionally the 0.3.5 baseline after revert |
| CAND-003 | Mobile | Decide whether `isDesktopOnly:false` is adequately supported or needs explicit follow-up |
| CAND-004 | Obsidian internals | Confirm minimal 0.3.5 compatibility styling is acceptable technical debt |

## 5. Reviewer Record
- Reviewed `ARCH.md` commit/hash: TBD
- Reviewer identity/model/provider/runtime: TBD
- Original architecture chat/history supplied: No / Partial / Yes — reviewer must record
- Independence rationale: TBD
- Known limitations reviewed: KL-001 / RISK-003

## 6. Baseline Decision
- [ ] Mandatory Compliance = 100%.
- [ ] Critical = 0.
- [ ] Major = 0.
- [ ] Review target hash equals baseline candidate hash.
- [ ] Downstream authoritative artifact set is identifiable.

> [!todo]- Result: 2026/09/14 02:05
> - [x] Project-specific QGate instance를 생성하고 13개 ARCH chapter와 evidence 위치를 연결함.
> - [x] 0.3.5 stable product baseline과 Known Limitation review focus를 명시함.
> - [ ] Original architecture context에 의존하지 않는 독립 Architecture Peer가 실제 score/evidence/finding을 채우고 final gate를 수행해야 함.

# ViewChecker Backend

🚀 KRDS 분석 + 예외 처리 Railway Backend

## 핵심 기능

✅ **예외 처리**: 체크리스트 기반 점수 조정  
✅ **KRDS 분석**: 27개 규칙 자동 검증  
✅ **Playwright 크롤링**: 실제 웹사이트 분석  

## API

### POST /api/analyze

**Request:**
```json
{
  "url": "https://www.mois.go.kr",
  "viewport": "desktop",
  "exceptions": [
    {
      "item_key": "colors",
      "item_name": "색상",
      "section": "디자인 스타일",
      "reason": "기관 특성상 예외"
    }
  ],
  "checklist_id": "template-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "exceptionInfo": {
      "applied": true,
      "originalScore": 42,
      "adjustedScore": 85,
      "scoreDifference": 43
    },
    "designStyles": [...],
    "components": [...],
    "basicPatterns": [...],
    "servicePatterns": [...]
  }
}
```

## Railway 배포

1. GitHub에 push
2. Railway Dashboard → New Project
3. GitHub 저장소 연결
4. 자동 배포

## 로컬 실행

```bash
npm install
npm start
```

Server: http://localhost:3002

/**
 * 예외 처리 핵심 로직
 * Railway Backend의 핵심 기능
 */

/**
 * 예외 항목을 분석 결과에 적용
 * @param {Object} analysisResults - 원본 분석 결과
 * @param {Array} exceptions - 예외 항목 배열
 * @param {String} checklistId - 체크리스트 ID
 * @returns {Object} 조정된 분석 결과
 */
function applyExceptions(analysisResults, exceptions, checklistId) {
  if (!exceptions || exceptions.length === 0) {
    console.log('ℹ️ 예외 항목 없음 - 원본 점수 반환');
    return analysisResults;
  }

  console.log('🔧 [예외 처리] 시작:', {
    원본점수: analysisResults.overallScore,
    예외개수: exceptions.length,
    체크리스트ID: checklistId
  });

  // 깊은 복사
  const adjusted = JSON.parse(JSON.stringify(analysisResults));

  // 섹션별 예외 그룹화
  const exceptionsBySection = groupExceptionsBySection(exceptions);

  // 각 섹션 조정
  if (exceptionsBySection['디자인 스타일'] && adjusted.designStyles) {
    adjusted.designStyles = adjustSection(
      adjusted.designStyles,
      exceptionsBySection['디자인 스타일'],
      'category'
    );
  }

  if (exceptionsBySection['컴포넌트'] && adjusted.components) {
    adjusted.components = adjustSection(
      adjusted.components,
      exceptionsBySection['컴포넌트'],
      'type'
    );
  }

  if (exceptionsBySection['기본 패턴'] && adjusted.basicPatterns) {
    adjusted.basicPatterns = adjustSection(
      adjusted.basicPatterns,
      exceptionsBySection['기본 패턴'],
      'name'
    );
  }

  if (exceptionsBySection['서비스 패턴'] && adjusted.servicePatterns) {
    adjusted.servicePatterns = adjustSection(
      adjusted.servicePatterns,
      exceptionsBySection['서비스 패턴'],
      'name'
    );
  }

  // krdsCompliance 내부 데이터도 조정
  if (adjusted.krdsCompliance) {
    if (exceptionsBySection['디자인 스타일'] && adjusted.krdsCompliance.designTokensDetail) {
      adjusted.krdsCompliance.designTokensDetail = adjustDesignTokensDetail(
        adjusted.krdsCompliance.designTokensDetail,
        exceptionsBySection['디자인 스타일']
      );
    }

    if (exceptionsBySection['컴포넌트'] && adjusted.krdsCompliance.krdsComponents) {
      adjusted.krdsCompliance.krdsComponents = adjustSection(
        adjusted.krdsCompliance.krdsComponents,
        exceptionsBySection['컴포넌트'],
        'type'
      );
    }
  }

  // 전체 점수 재계산
  const originalScore = analysisResults.overallScore;
  adjusted.overallScore = calculateOverallScore(adjusted);

  // 조정 정보 추가
  adjusted.exceptionInfo = {
    applied: true,
    checklistId: checklistId,
    totalExceptions: exceptions.length,
    originalScore: originalScore,
    adjustedScore: adjusted.overallScore,
    scoreDifference: adjusted.overallScore - originalScore,
    sections: Object.keys(exceptionsBySection)
  };

  console.log('✅ [예외 처리] 완료:', {
    원본: originalScore,
    조정: adjusted.overallScore,
    증가: `+${adjusted.overallScore - originalScore}점`
  });

  return adjusted;
}

/**
 * 섹션별 예외 그룹화
 */
function groupExceptionsBySection(exceptions) {
  const grouped = {};
  
  exceptions.forEach(exc => {
    const section = exc.section || exc.category || '기타';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(exc);
  });

  return grouped;
}

/**
 * 섹션 항목 조정
 */
function adjustSection(items, exceptions, keyField = 'category') {
  if (!items || items.length === 0) return items;

  const excludedKeys = exceptions.map(e => 
    e.item_key || e.item_name || ''
  ).filter(Boolean);

  let adjustedCount = 0;

  const result = items.map(item => {
    const itemKey = item[keyField] || item.name || item.englishName || '';
    
    // 예외 항목에 포함되면 100점 처리
    if (excludedKeys.includes(itemKey)) {
      adjustedCount++;
      return {
        ...item,
        score: 100,
        compliance: typeof item.compliance === 'string' ? '준수' : 100,
        issues: [],
        excluded: true,
        exclusionReason: exceptions.find(e => 
          (e.item_key || e.item_name) === itemKey
        )?.reason || '예외 항목'
      };
    }
    return item;
  });

  console.log(`  ✓ ${adjustedCount}/${items.length}개 항목 조정됨`);

  return result;
}

/**
 * designTokensDetail 조정
 */
function adjustDesignTokensDetail(detail, exceptions) {
  if (!detail) return detail;

  const excludedKeys = exceptions.map(e => 
    e.item_key || e.item_name || ''
  ).filter(Boolean);

  const adjusted = { ...detail };

  Object.keys(adjusted).forEach(key => {
    if (excludedKeys.includes(key)) {
      adjusted[key] = {
        ...adjusted[key],
        score: 100,
        compliance: [],
        issues: [],
        passed: ['예외 처리로 완벽 준수'],
        excluded: true
      };
    }
  });

  return adjusted;
}

/**
 * 전체 점수 재계산
 */
function calculateOverallScore(data) {
  const scores = [];

  if (data.designStyles && data.designStyles.length > 0) {
    scores.push(calculateCategoryScore(data.designStyles));
  }

  if (data.components && data.components.length > 0) {
    scores.push(calculateCategoryScore(data.components));
  }

  if (data.basicPatterns && data.basicPatterns.length > 0) {
    scores.push(calculateCategoryScore(data.basicPatterns));
  }

  if (data.servicePatterns && data.servicePatterns.length > 0) {
    scores.push(calculateCategoryScore(data.servicePatterns));
  }

  if (scores.length === 0) return 0;

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(average);
}

/**
 * 카테고리 평균 점수 계산
 */
function calculateCategoryScore(items) {
  if (!items || items.length === 0) return 0;
  
  const total = items.reduce((sum, item) => {
    const score = item.score || item.compliance || 0;
    return sum + (typeof score === 'number' ? score : 0);
  }, 0);

  return Math.round(total / items.length);
}

module.exports = {
  applyExceptions
};

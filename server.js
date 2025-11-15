/**
 * ViewChecker Backend Server
 * Express + Playwright + KRDS Analysis
 */

const express = require('express');
const cors = require('cors');
const { analyzeWebsite } = require('./analyzer');
const { applyExceptions } = require('./exceptionHandler');

const app = express();
const PORT = process.env.PORT || 3002;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 요청 로깅
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * 메인 분석 API
 * POST /api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  const { url, viewport = 'desktop', exceptions = [], checklist_id } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 [API 요청]');
  console.log('  URL:', url);
  console.log('  Viewport:', viewport);
  console.log('  예외 항목:', exceptions.length, '개');
  console.log('  체크리스트 ID:', checklist_id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  try {
    // 1. KRDS 분석 실행
    const analysisResult = await analyzeWebsite(url, viewport);

    if (!analysisResult.success) {
      return res.status(500).json(analysisResult);
    }

    // 2. 예외 처리 적용
    const finalResult = applyExceptions(
      analysisResult.data,
      exceptions,
      checklist_id
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [API 응답]');
    console.log('  원본 점수:', analysisResult.data.overallScore);
    console.log('  조정 점수:', finalResult.overallScore);
    console.log('  예외 적용:', finalResult.exceptionInfo?.applied ? 'YES' : 'NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({
      success: true,
      data: finalResult
    });

  } catch (error) {
    console.error('❌ [API 에러]:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * 404 핸들러
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/**
 * 에러 핸들러
 */
app.use((err, req, res, next) => {
  console.error('💥 [서버 에러]:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * 서버 시작
 */
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║                                               ║');
  console.log('║   🚀 ViewChecker Backend Server Running      ║');
  console.log('║                                               ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('');
  console.log('✅ 예외 처리 기능: 활성화');
  console.log('✅ KRDS 분석 엔진: 활성화');
  console.log('✅ Playwright 크롤러: 활성화');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM 신호 수신 - 서버 종료 중...');
  process.exit(0);
});

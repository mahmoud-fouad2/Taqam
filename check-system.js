#!/usr/bin/env node

/**
 * Quick System Check
 * Run: node check-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 فحص نظام Taqam HR Platform...\n');

const checks = {
  files: [
    // Audit System
    { path: 'lib/audit/logger.ts', name: 'Audit Logger' },
    { path: 'lib/audit/middleware.ts', name: 'Audit Middleware' },
    { path: 'app/api/audit-logs/route.ts', name: 'Audit Logs API' },
    { path: 'app/dashboard/audit-logs/page.tsx', name: 'Audit Logs UI' },
    
    // Sentry
    { path: 'instrumentation-client.ts', name: 'Sentry Client' },
    { path: 'sentry.server.config.ts', name: 'Sentry Server' },
    { path: 'sentry.edge.config.ts', name: 'Sentry Edge' },
    
    // Enhanced Logger
    { path: 'lib/logger.ts', name: 'Enhanced Logger' },
    
    // Documentation
    { path: 'FEATURES_AUDIT.md', name: 'Features Audit' },
    { path: 'IMPLEMENTATION_SUMMARY.md', name: 'Implementation Summary' },
    { path: 'SETUP_GUIDE.md', name: 'Setup Guide' },
    { path: 'PROJECT_STATUS.md', name: 'Project Status' },
  ],
  
  env: [
    { key: 'DATABASE_URL', required: true },
    { key: 'NEXTAUTH_SECRET', required: true },
    { key: 'NEXT_PUBLIC_SENTRY_DSN', required: false },
    { key: 'LOG_LEVEL', required: false, default: 'info' },
    { key: 'ENABLE_AUDIT_LOGGING', required: false, default: 'true' },
  ],
  
  packages: [
    '@sentry/nextjs',
    'pino',
    'pino-pretty',
  ],
};

let errors = 0;
let warnings = 0;

// Check files
console.log('📁 فحص الملفات:\n');
checks.files.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${name}`);
  } else {
    console.log(`  ❌ ${name} - مفقود: ${filePath}`);
    errors++;
  }
});

// Check packages
console.log('\n📦 فحص الحزم:\n');
const packageJson = require('./package.json');
checks.packages.forEach(pkg => {
  if (
    packageJson.dependencies?.[pkg] ||
    packageJson.devDependencies?.[pkg]
  ) {
    console.log(`  ✅ ${pkg}`);
  } else {
    console.log(`  ❌ ${pkg} - غير مثبت`);
    errors++;
  }
});

// Check environment variables
console.log('\n🔐 فحص المتغيرات البيئية:\n');
require('dotenv').config({ path: '.env.local' });
checks.env.forEach(({ key, required, default: defaultValue }) => {
  const value = process.env[key];
  if (value) {
    console.log(`  ✅ ${key} = ${value.substring(0, 20)}...`);
  } else if (required) {
    console.log(`  ❌ ${key} - مطلوب لكن مفقود`);
    errors++;
  } else {
    console.log(`  ⚠️  ${key} - اختياري (افتراضي: ${defaultValue || 'none'})`);
    warnings++;
  }
});

// Database check
console.log('\n🗄️  فحص قاعدة البيانات:\n');
if (process.env.DATABASE_URL) {
  console.log('  ✅ DATABASE_URL موجود');
  
  // Check if Prisma schema exists
  if (fs.existsSync(path.join(process.cwd(), 'prisma/schema.prisma'))) {
    console.log('  ✅ Prisma schema موجود');
    
    // Check if AuditLog model exists
    const schemaContent = fs.readFileSync(
      path.join(process.cwd(), 'prisma/schema.prisma'),
      'utf8'
    );
    if (schemaContent.includes('model AuditLog')) {
      console.log('  ✅ AuditLog model موجود في schema');
    } else {
      console.log('  ❌ AuditLog model مفقود من schema');
      errors++;
    }
  } else {
    console.log('  ❌ Prisma schema مفقود');
    errors++;
  }
} else {
  console.log('  ❌ DATABASE_URL غير موجود');
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('✅ جميع الفحوصات نجحت! النظام جاهز.\n');
} else {
  console.log(`\n📊 الملخص:`);
  console.log(`  ❌ أخطاء: ${errors}`);
  console.log(`  ⚠️  تحذيرات: ${warnings}`);
  console.log('');
  
  if (errors > 0) {
    console.log('⚠️  يرجى حل الأخطاء قبل المتابعة.\n');
    process.exit(1);
  } else {
    console.log('✅ لا توجد أخطاء. التحذيرات اختيارية.\n');
  }
}

// Next steps
if (warnings > 0 || errors > 0) {
  console.log('📚 الخطوات التالية:\n');
  
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('  1. أضف NEXT_PUBLIC_SENTRY_DSN إلى .env.local');
    console.log('     - انتقل إلى https://sentry.io');
    console.log('     - أنشئ مشروع Next.js جديد');
    console.log('     - انسخ الـ DSN\n');
  }
  
  if (!process.env.LOG_LEVEL) {
    console.log('  2. اضبط LOG_LEVEL في .env.local');
    console.log('     LOG_LEVEL=info\n');
  }
  
  console.log('  راجع SETUP_GUIDE.md للتفاصيل\n');
}

console.log('🚀 لتشغيل المشروع:');
console.log('   npm run dev\n');
console.log('📊 لعرض Audit Logs:');
console.log('   http://localhost:3000/dashboard/audit-logs\n');

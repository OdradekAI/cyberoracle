import { NextResponse } from 'next/server';
import { PACKAGE_NAME as corePkg, checkContent } from '@cyberoracle/core';

export function GET() {
  const safetySample = checkContent('hello');
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    packages: { core: corePkg },
    contentSafety: safetySample.safe,
  });
}

import { trace } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { PrismaInstrumentation } from '@prisma/instrumentation';

let prismaTracingRegistered = false;

export function registerPrismaTracing(): void {
  if (prismaTracingRegistered) return;

  registerInstrumentations({
    tracerProvider: trace.getTracerProvider(),
    instrumentations: [new PrismaInstrumentation()],
  });

  prismaTracingRegistered = true;
}
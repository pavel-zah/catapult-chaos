export const WORLD = {
  width: 1920,
  height: 1080,
  fixedStepMs: 1000 / 60,
  maxFrameMs: 100,
} as const;

export const PHYSICS = {
  spawnGraceMs: 400,
  maxSpeed: 42,
  velocityIterations: 8,
  positionIterations: 10,
} as const;

export const SETTLING = {
  speedThreshold: 0.42,
  angularSpeedThreshold: 0.045,
  stableMs: 800,
  timeoutAfterImpactMs: 7000,
  absoluteTimeoutMs: 12000,
} as const;

export const SLINGSHOT = {
  maxStretch: 155,
  launchPower: 0.19,
  minStretch: 18,
  trajectorySteps: 72,
  trajectoryStride: 3,
} as const;

export const JUICE = {
  maxShake: 22,
  strongImpact: 90,
  hitstopMs: 45,
  maxPreviousTrails: 3,
} as const;

export const PORTAL_COOLDOWN_MS = 250;
export const GOAL_HOLD_MS = 800;

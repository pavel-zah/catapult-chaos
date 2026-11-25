import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';
import { channelColor, drawChannelIndicator, overlappingDynamicBodies } from './gadgetUtils';

const PLATE = {
  width: 150,
  height: 20,
  minMass: 15,
  sensorHeight: 34,
  maxSag: 8,
} as const;

export const createPressurePlate = defineGadgetFactory('pressure_plate', (spawn, context) => {
  const { physics, channels } = context;
  const width = spawn.width ?? PLATE.width;
  const height = spawn.height ?? PLATE.height;
  const minMass = spawn.minMass ?? PLATE.minMass;
  const plate = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    friction: 0.85,
    label: 'gadget:pressure_plate',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'pressure_plate', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  const sensor = attachMetadata(Matter.Bodies.rectangle(
    spawn.x,
    spawn.y - height / 2 - PLATE.sensorHeight / 2 + 3,
    width - 8,
    PLATE.sensorHeight,
    { isStatic: true, isSensor: true, label: 'gadget:pressure_sensor' },
  ), {
    entityId: spawn.id, kind: 'gadget', typeId: 'pressure_plate_sensor', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height: PLATE.sensorHeight,
  });
  physics.add(plate, sensor);

  let totalMass = 0;
  let active = false;
  channels.setSource(spawn.channelId, spawn.id, false);

  return {
    id: spawn.id,
    type: 'pressure_plate',
    bodies: [plate, sensor],
    update: () => {
      totalMass = overlappingDynamicBodies(sensor, physics)
        .reduce((sum, body) => sum + body.mass, 0);
      const nextActive = totalMass >= minMass;
      if (nextActive !== active) {
        active = nextActive;
        channels.setSource(spawn.channelId, spawn.id, active);
      }
    },
    render: ({ ctx }) => {
      const ratio = Math.min(1, totalMass / minMass);
      const sag = ratio * PLATE.maxSag;
      ctx.save();
      ctx.translate(plate.position.x, plate.position.y);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-width / 2, 0, width, height);
      ctx.fillStyle = active ? channelColor(spawn.channelId) : '#94a3b8';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2 + sag, width, height * 0.65, 5);
      ctx.fill();
      ctx.stroke();
      const barY = height / 2 + 13;
      ctx.fillStyle = '#172033';
      ctx.fillRect(-width / 2, barY, width, 7);
      ctx.fillStyle = channelColor(spawn.channelId);
      ctx.fillRect(-width / 2, barY, width * ratio, 7);
      drawChannelIndicator(ctx, spawn.channelId, active, width / 2 + 15, 0);
      ctx.restore();
    },
  };
});

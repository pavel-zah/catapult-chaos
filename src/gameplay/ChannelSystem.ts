import type { EventBus } from '../core/EventBus';

/** Combines trigger states per channel with logical OR and notifies receivers through EventBus. */
export class ChannelSystem {
  private sources = new Map<string, Map<string, boolean>>();

  constructor(private readonly events: EventBus) {}

  setSource(channelId: string, sourceId: string, active: boolean): void {
    let channel = this.sources.get(channelId);
    if (!channel) {
      channel = new Map<string, boolean>();
      this.sources.set(channelId, channel);
    }
    if (channel.get(sourceId) === active) return;
    channel.set(sourceId, active);
    this.events.emit('channel:changed', {
      channelId,
      sourceId,
      active: this.isActive(channelId),
    });
  }

  isActive(channelId: string): boolean {
    const channel = this.sources.get(channelId);
    if (!channel) return false;
    for (const active of channel.values()) {
      if (active) return true;
    }
    return false;
  }

  receiverSignal(channelId?: string, invertSignal = false, defaultWithoutChannel = true): boolean {
    if (!channelId) return defaultWithoutChannel;
    const active = this.isActive(channelId);
    return invertSignal ? !active : active;
  }

  reset(): void {
    const activeChannels = [...this.sources.keys()].filter((id) => this.isActive(id));
    this.sources.clear();
    for (const channelId of activeChannels) {
      this.events.emit('channel:changed', { channelId, sourceId: '', active: false });
    }
  }
}

import type { MQTTMessage } from '../types';

type MessageCallback = (payload: string) => void;
type LogCallback = (message: MQTTMessage) => void;

class MqttBroker {
  private subscriptions: Map<string, Map<string, MessageCallback>> = new Map();
  private messageLog: MQTTMessage[] = [];
  private logCallbacks: Set<LogCallback> = new Set();
  private maxLogSize = 100;

  public subscribe(topic: string, subId: string, callback: MessageCallback): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Map());
    }
    this.subscriptions.get(topic)!.set(subId, callback);
    
    // Log subscription event
    this.logSystemMessage(`SYSTEM/BROKER`, `Client [${subId}] subscribed to topic: ${topic}`, 'sub');
  }

  public unsubscribe(topic: string, subId: string): void {
    const topicSubs = this.subscriptions.get(topic);
    if (topicSubs) {
      topicSubs.delete(subId);
      if (topicSubs.size === 0) {
        this.subscriptions.delete(topic);
      }
      this.logSystemMessage(`SYSTEM/BROKER`, `Client [${subId}] unsubscribed from topic: ${topic}`, 'sub');
    }
  }

  public publish(topic: string, payload: string, origin: 'pub' | 'sub' = 'pub'): void {
    const timestamp = new Date().toISOString();
    const message: MQTTMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      topic,
      payload,
      type: origin,
    };

    // Add to log
    this.messageLog.push(message);
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.shift();
    }

    // Notify logs listeners
    this.logCallbacks.forEach(cb => cb(message));

    // Deliver to subscribers
    // Handle wildcard matching (e.g. "verdantiq/greenhouses/+/telemetry")
    this.subscriptions.forEach((subsMap, subTopic) => {
      if (this.matchTopic(subTopic, topic)) {
        subsMap.forEach(callback => {
          try {
            callback(payload);
          } catch (e) {
            console.error(`Error in MQTT subscriber for ${subTopic}:`, e);
          }
        });
      }
    });
  }

  public getMessageLog(): MQTTMessage[] {
    return [...this.messageLog];
  }

  public clearLog(): void {
    this.messageLog = [];
  }

  public onLogMessage(callback: LogCallback): () => void {
    this.logCallbacks.add(callback);
    return () => {
      this.logCallbacks.delete(callback);
    };
  }

  private logSystemMessage(topic: string, payload: string, type: 'pub' | 'sub'): void {
    const timestamp = new Date().toISOString();
    const message: MQTTMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      topic,
      payload,
      type,
    };
    this.messageLog.push(message);
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.shift();
    }
    this.logCallbacks.forEach(cb => cb(message));
  }

  private matchTopic(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length !== topicParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '+') {
        continue; // single-level wildcard matches anything
      }
      if (patternParts[i] !== topicParts[i]) {
        return false;
      }
    }

    return true;
  }
}

export const mqttBroker = new MqttBroker();

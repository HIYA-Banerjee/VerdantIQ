import type { Greenhouse, AutomationRule } from '../types';

export class RuleEngine {
  public static evaluateRules(
    greenhouse: Greenhouse,
    rules: AutomationRule[],
    onTrigger: (rule: AutomationRule, shouldActivate: boolean) => void
  ): string[] {
    const triggeredRules: string[] = [];

    rules.forEach(rule => {
      if (!rule.active) return;

      const sensorVal = greenhouse.sensors[rule.sensor];
      const isStatusNormal = greenhouse.sensorStatus[rule.sensor] === 'online';
      
      // Do not run rules on failed/offline sensors to simulate realistic safety interlocks
      if (!isStatusNormal) return;

      let conditionMet = false;
      if (rule.operator === 'less') {
        conditionMet = sensorVal < rule.value;
      } else if (rule.operator === 'greater') {
        conditionMet = sensorVal > rule.value;
      }

      const desiredState = rule.action === 'ON';
      const currentState = greenhouse.actuators[rule.actuator];

      if (conditionMet && currentState !== desiredState) {
        triggeredRules.push(rule.name);
        onTrigger(rule, desiredState);
      }
    });

    return triggeredRules;
  }
}

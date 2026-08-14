export class OnlineExamProctoringCore {
  calculateRisk(events: any[], policy?: any) {
    return events.reduce((total, event) => {
      let weight = 5;
      if (event.eventType === 'TAB_HIDDEN') weight = policy?.weightTabHidden ?? 10;
      else if (event.eventType === 'WINDOW_BLUR') weight = policy?.weightWindowBlur ?? 5;
      else if (event.eventType === 'FULLSCREEN_EXIT') weight = policy?.weightExitFull ?? 15;
      else if (event.eventType === 'COPY_ATTEMPT') weight = policy?.weightCopyPaste ?? 20;
      else if (event.eventType === 'MULTIPLE_SESSION') weight = policy?.weightMultiSession ?? 50;
      return total + weight;
    }, 0);
  }

  shouldFlag(currentRiskScore: number, addedRisk: number, policy?: any) {
    const newRiskScore = currentRiskScore + addedRisk;
    const threshold = policy?.reviewThreshold ?? 40;
    return { newRiskScore, shouldFlag: newRiskScore >= threshold };
  }
}

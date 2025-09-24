import PenaltyCalculator from '../PenaltyCalculator';

export default function PenaltyCalculatorExample() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      <PenaltyCalculator
        vesselName="Atlantic Pioneer"
        currentIntensity={82.4}
        targetIntensity={89.3}
        energyUsed={125000}
      />
      <PenaltyCalculator
        vesselName="Mediterranean Express"
        currentIntensity={98.6}
        targetIntensity={89.3}
        energyUsed={285000}
      />
    </div>
  );
}
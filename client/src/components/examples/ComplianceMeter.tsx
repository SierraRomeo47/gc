import ComplianceMeter from '../ComplianceMeter';

export default function ComplianceMeterExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <ComplianceMeter
        title="Annual GHG Intensity"
        currentIntensity={85.2}
        targetIntensity={89.3}
        compliancePercentage={95}
        trend="down"
        status="compliant"
      />
      <ComplianceMeter
        title="Q3 Performance"
        currentIntensity={92.1}
        targetIntensity={89.3}
        compliancePercentage={103}
        trend="up"
        status="warning"
      />
      <ComplianceMeter
        title="Next Year Target"
        currentIntensity={95.4}
        targetIntensity={85.7}
        compliancePercentage={111}
        trend="stable"
        status="non-compliant"
      />
    </div>
  );
}
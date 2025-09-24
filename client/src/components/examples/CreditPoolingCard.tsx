import CreditPoolingCard from '../CreditPoolingCard';

export default function CreditPoolingCardExample() {
  // todo: remove mock functionality
  const mockTransactions = [
    {
      id: "1",
      type: "bank" as const,
      amount: 50.5,
      date: "2025-01-15",
      status: "completed" as const
    },
    {
      id: "2", 
      type: "trade" as const,
      amount: 25.0,
      counterparty: "Nordic Carrier",
      date: "2025-01-12",
      status: "pending" as const
    },
    {
      id: "3",
      type: "borrow" as const,
      amount: 75.2,
      date: "2025-01-10",
      status: "completed" as const
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      <CreditPoolingCard
        vesselName="Atlantic Pioneer"
        currentBalance={125.3}
        bankedCredits={180.0}
        borrowedCredits={54.7}
        availableForTrading={92.5}
        recentTransactions={mockTransactions}
      />
      <CreditPoolingCard
        vesselName="Nordic Carrier"
        currentBalance={-45.7}
        bankedCredits={25.0}
        borrowedCredits={70.7}
        availableForTrading={15.2}
        recentTransactions={mockTransactions.slice(0, 1)}
      />
    </div>
  );
}
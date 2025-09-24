import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, TrendingUp } from "lucide-react";

interface CreditTransaction {
  id: string;
  type: "bank" | "borrow" | "trade";
  amount: number;
  counterparty?: string;
  date: string;
  status: "pending" | "completed" | "rejected";
}

interface CreditPoolingCardProps {
  vesselName: string;
  currentBalance: number;
  bankedCredits: number;
  borrowedCredits: number;
  availableForTrading: number;
  recentTransactions: CreditTransaction[];
  onBankCredits?: () => void;
  onBorrowCredits?: () => void;
  onTradeCredits?: () => void;
}

const CreditPoolingCard = ({
  vesselName,
  currentBalance,
  bankedCredits,
  borrowedCredits,
  availableForTrading,
  recentTransactions,
  onBankCredits,
  onBorrowCredits,
  onTradeCredits
}: CreditPoolingCardProps) => {
  const handleBankCredits = () => {
    console.log('Bank credits triggered for vessel:', vesselName);
    onBankCredits?.();
  };

  const handleBorrowCredits = () => {
    console.log('Borrow credits triggered for vessel:', vesselName);
    onBorrowCredits?.();
  };

  const handleTradeCredits = () => {
    console.log('Trade credits triggered for vessel:', vesselName);
    onTradeCredits?.();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <ArrowUpRight className="h-3 w-3 text-green-600" />;
      case "borrow":
        return <ArrowDownLeft className="h-3 w-3 text-blue-600" />;
      case "trade":
        return <RefreshCw className="h-3 w-3 text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="text-xs">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover-elevate" data-testid="credit-pooling-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Credit Pooling - {vesselName}</span>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Balance Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-lg font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="current-balance">
                {currentBalance >= 0 ? '+' : ''}{currentBalance.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Available for Trading</p>
              <p className="text-lg font-bold" data-testid="available-trading">
                {availableForTrading.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Banking & Borrowing Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Banked Credits</p>
              <p className="font-medium text-green-600">+{bankedCredits.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Borrowed Credits</p>
              <p className="font-medium text-blue-600">-{borrowedCredits.toFixed(1)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleBankCredits}
              data-testid="button-bank-credits"
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Bank
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleBorrowCredits}
              data-testid="button-borrow-credits"
            >
              <ArrowDownLeft className="h-4 w-4 mr-1" />
              Borrow
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleTradeCredits}
              data-testid="button-trade-credits"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Trade
            </Button>
          </div>

          {/* Recent Transactions */}
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(transaction.type)}
                    <span className="capitalize">{transaction.type}</span>
                    <span className="font-medium">{transaction.amount.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(transaction.status)}
                    <span className="text-muted-foreground">{transaction.date}</span>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditPoolingCard;
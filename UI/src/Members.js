function Members({ groupDetails, removeMember, settleBalance, expandedMember, setExpandedMember, loading }) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-medium text-indigo-700 mb-4">Members</h3>
        <div className="space-y-4">
          {groupDetails.members && groupDetails.members.length > 0 ? (
            groupDetails.members.map(member => {
              const allDebts = groupDetails.members.flatMap(m => m.debts || []);
              const totalOwes = member.debts?.filter(d => d.debtorId === member.userId).reduce((s, d) => s + d.amount, 0) || 0;
              const totalOwed = allDebts.filter(d => d.creditorId === member.userId).reduce((s, d) => s + d.amount, 0) || 0;
  
              return (
                <div key={member.id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                  >
                    <div>
                      <span className="text-gray-600 font-medium">
                        {member.username || `User ${member.userId}`}{' '}
                        {member.balance !== 0
                          ? member.balance > 0
                            ? `(Owed €${member.balance.toFixed(2)})`
                            : `(Owes €${Math.abs(member.balance).toFixed(2)})`
                          : '(Settled)'}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        Total Owes: €{totalOwes.toFixed(2)} | Total Owed: €{totalOwed.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Net Balance: €{member.balance.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {totalOwes > 0 && member.debts?.some(d => d.debtorId === member.userId && d.amount > 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const debt = member.debts.find(d => d.debtorId === member.userId && d.amount > 0);
                            settleBalance(groupDetails.id, member.userId, debt.creditorId, debt.amount);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          disabled={loading.settle}
                        >
                          Settle Debt
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMember(groupDetails.id, member.userId);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        disabled={loading.removeMember}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
  
                  {expandedMember === member.id && (
                    <div className="mt-4 pl-4 border-t pt-2">
                      <h4 className="text-gray-600 font-medium">Debt Breakdown:</h4>
                      <ul className="list-disc pl-5">
                        {groupDetails.members
                          .filter(m => m.userId !== member.userId)
                          .map(om => {
                            const owes = member.debts?.find(d => d.debtorId === member.userId && d.creditorId === om.userId)?.amount || 0;
                            const owed = allDebts.find(d => d.debtorId === om.userId && d.creditorId === member.userId)?.amount || 0;
  
                            const relevantTransactions = groupDetails.transactions?.filter(tx =>
                              (tx.payerId === member.userId && tx.splits.some(s => s.userId === om.userId)) ||
                              (tx.payerId === om.userId && tx.splits.some(s => s.userId === member.userId))
                            ) || [];
  
                            return (
                              <li key={om.userId} className="text-gray-600">
                                <div>
                                  {owes > 0 && `${member.username || `User ${member.userId}`} owes ${om.username || `User ${om.userId}`} €${owes.toFixed(2)}`}
                                  {owed > 0 && `${member.username || `User ${member.userId}`} is owed €${owed.toFixed(2)} by ${om.username || `User ${om.userId}`}`}
                                  {owes === 0 && owed === 0 && `No debts with ${om.username || `User ${om.userId}`}`}
                                </div>
                                {relevantTransactions.length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-sm text-indigo-600 cursor-pointer">Transaction History</summary>
                                    <ul className="list-circle pl-5 text-sm text-gray-500">
                                      {relevantTransactions.map(tx => {
                                        const payer = groupDetails.members.find(m => m.userId === tx.payerId);
                                        const splitAmount = tx.splits.find(s => s.userId === (tx.payerId === member.userId ? om.userId : member.userId))?.amount || 0;
                                        return (
                                          <li key={tx.id}>
                                            {payer?.username || `User ${tx.payerId}`} paid €{tx.amount.toFixed(2)} on{' '}
                                            {new Date(tx.createdAt).toLocaleString()} ({tx.splitType} split, €{splitAmount.toFixed(2)} for{' '}
                                            {tx.payerId === member.userId ? om.username || `User ${om.userId}` : member.username || `User ${member.userId}`})
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </details>
                                )}
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No members in this group.</p>
          )}
        </div>
      </div>
    );
  }
  
  export default Members;
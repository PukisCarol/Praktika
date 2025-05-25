import Members from './Members';
import AddMember from './AddMember';
import TransactionForm from './TransactionForm';

function GroupDetails({
  groupDetails,
  setGroupDetails,
  navigate,
  error,
  newMemberUsername,
  setNewMemberUsername,
  addMember,
  removeMember,
  transaction,
  setTransaction,
  showTransactionForm,
  setShowTransactionForm,
  createTransaction,
  settleBalance,
  expandedMember,
  setExpandedMember,
  loading,
  calculateEqualSplit
}) {
  return (
    <div className="bg-indigo-50 p-6 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-indigo-800">{groupDetails.title || "Untitled Group"}</h2>
        <button
          onClick={() => {
            setGroupDetails(null);
            navigate("/");
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Back to Groups
        </button>
      </div>

      {error.group && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
          {error.group}
        </div>
      )}

      <Members
        groupDetails={groupDetails}
        removeMember={removeMember}
        settleBalance={settleBalance}
        expandedMember={expandedMember}
        setExpandedMember={setExpandedMember}
        loading={loading}
      />

      <AddMember
        newMemberUsername={newMemberUsername}
        setNewMemberUsername={setNewMemberUsername}
        addMember={addMember}
        loading={loading.addMember}
      />

      <div className="mb-8">
        <h3 className="text-xl font-medium text-indigo-700 mb-4">Transactions</h3>
        {groupDetails.transactions?.length === 0 ? (
          <p className="text-gray-500">No transactions yet. Create one below!</p>
        ) : (
          <div className="space-y-3">
            {groupDetails.transactions?.map(tx => (
              <div key={tx.id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                {groupDetails.members.find(m => m.userId === tx.payerId)?.username || `User ${tx.payerId}`}{' '}
                paid €{tx.amount.toFixed(2)} ({tx.splitType})
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={() => setShowTransactionForm(!showTransactionForm)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 mb-4"
        >
          {showTransactionForm ? "Hide Transaction Form" : "+ Transaction"}
        </button>
        {showTransactionForm && (
          <TransactionForm
            groupDetails={groupDetails}
            transaction={transaction}
            setTransaction={setTransaction}
            createTransaction={createTransaction}
            error={error.transaction}
            loading={loading.createTransaction}
            calculateEqualSplit={calculateEqualSplit}
          />
        )}
      </div>
    </div>
  );
}

export default GroupDetails;
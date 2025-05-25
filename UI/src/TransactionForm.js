function TransactionForm({ groupDetails, transaction, setTransaction, createTransaction, error, loading, calculateEqualSplit }) {
    return (
      <form onSubmit={(e) => createTransaction(groupDetails.id, e)} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Payer</label>
          <select
            value={transaction.payerId}
            onChange={(e) => setTransaction({ ...transaction, payerId: e.target.value })}
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select payer</option>
            {groupDetails.members?.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.username || `User ${member.userId}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">Amount</label>
          <input
            type="number"
            value={transaction.amount || ""}
            onChange={(e) => setTransaction({ ...transaction, amount: parseFloat(e.target.value) || 0 })}
            placeholder="Enter amount"
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">Split Type</label>
          <select
            value={transaction.splitType}
            onChange={(e) => {
              const splitType = e.target.value;
              setTransaction({ ...transaction, splitType, specificMemberId: "", splits: {} });
            }}
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Equal">Split Equally</option>
            <option value="Percentage">Split by Percentage</option>
            <option value="Dynamically">Split Dynamically</option>
            <option value="Specific">Pay for Specific Member</option>
          </select>
        </div>
        {transaction.splitType === "Equal" && (
          <p className="text-gray-600">
            Amount will be split equally: €{calculateEqualSplit()} per member
          </p>
        )}
        {transaction.splitType === "Specific" && (
          <div>
            <label className="block text-gray-600 font-medium mb-1">Select Member</label>
            <select
              value={transaction.specificMemberId}
              onChange={(e) => setTransaction({ ...transaction, specificMemberId: e.target.value })}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select member</option>
              {groupDetails.members?.filter(m => m.userId !== transaction.payerId).map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.username || `User ${member.userId}`}
                </option>
              ))}
            </select>
          </div>
        )}
        {["Percentage", "Dynamically"].includes(transaction.splitType) && groupDetails.members && (
          groupDetails.members.map(member => (
            <div key={member.userId} className="flex items-center gap-4 mt-2">
              <span className="w-1/3 text-gray-600 font-medium">
                {member.username || `User ${member.userId}`}
              </span>
              <input
                type="number"
                placeholder={transaction.splitType === "Percentage" ? "Percentage (%)" : "Amount"}
                value={transaction.splits[member.userId] || ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setTransaction({
                    ...transaction,
                    splits: { ...transaction.splits, [member.userId]: value }
                  });
                }}
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                step={transaction.splitType === "Percentage" ? "1" : "0.01"}
              />
            </div>
          ))
        )}
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 w-full disabled:opacity-50"
          disabled={loading}
        >
          Create Transaction
        </button>
      </form>
    );
  }
  
  export default TransactionForm;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateGroup from './CreateGroup';
import GroupsList from './GroupsList';
import GroupDetails from './GroupDetails';

function App() {
  const [groups, setGroups] = useState([]);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [transaction, setTransaction] = useState({
    payerId: "",
    amount: 0,
    splitType: "Equal",
    splits: {},
    specificMemberId: ""
  });
  const [error, setError] = useState({ global: "", group: "", member: "", transaction: "" });
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState({
    fetch: false,
    createGroup: false,
    addMember: false,
    removeMember: false,
    settle: false,
    createTransaction: false
  });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [modalError, setModalError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUserId = "user1"; // Hardcoded for simplicity

  // Fetch all groups for the user
  const fetchGroups = async () => {
    setLoading({ ...loading, fetch: true });
    try {
      console.log("Fetching groups from API...");
      const response = await fetch("https://localhost:7061/api/group");
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
      setError({ ...error, global: "" });
    } catch (err) {
      console.error("Fetch groups error:", err);
      setError({ ...error, global: "Error fetching groups: " + err.message });
    } finally {
      setLoading({ ...loading, fetch: false });
    }
  };

  // Fetch specific group details
  const fetchGroupDetails = async (groupId) => {
    setLoading({ ...loading, fetch: true });
    try {
      console.log(`Fetching group details for ID: ${groupId}`);
      const response = await fetch(`https://localhost:7061/api/group/${groupId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch group details: ${errorText || response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched group details:", JSON.stringify(data, null, 2));
      setGroupDetails(data);
      setError({ ...error, group: "" });
    } catch (err) {
      console.error("Fetch group details error:", err);
      setError({ ...error, group: "Error fetching group details: " + err.message });
      navigate("/");
    } finally {
      setLoading({ ...loading, fetch: false });
    }
  };

  // Create a new group
  const createGroup = async () => {
    if (!newGroupTitle.trim()) {
      setError({ ...error, global: "Group title cannot be empty" });
      return;
    }
    setLoading({ ...loading, createGroup: true });
    try {
      const response = await fetch("https://localhost:7061/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroupTitle)
      });
      if (!response.ok) throw new Error(await response.text());
      setNewGroupTitle("");
      setSuccess("Group created successfully!");
      fetchGroups();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError({ ...error, global: "Error creating group: " + err.message });
    } finally {
      setLoading({ ...loading, createGroup: false });
    }
  };

  // Add a member to a group
  const addMember = async (e) => {
    e.preventDefault();
    if (!newMemberUsername.trim()) {
      setError({ ...error, member: "Member username cannot be empty" });
      return;
    }
    setLoading({ ...loading, addMember: true });
    try {
      const response = await fetch(`https://localhost:7061/api/group/${groupDetails.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberUsername)
      });
      if (!response.ok) throw new Error(await response.text());
      setNewMemberUsername("");
      setSuccess("Member added successfully!");
      fetchGroupDetails(groupDetails.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError({ ...error, member: "Error adding member: " + err.message });
    } finally {
      setLoading({ ...loading, addMember: false });
    }
  };

  // Remove a member from a group
  const removeMember = async (groupId, memberId) => {
    setLoading({ ...loading, removeMember: true });
    try {
      const response = await fetch(`https://localhost:7061/api/group/${groupId}/members/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error(await response.text());
      setSuccess("Member removed successfully!");
      await fetchGroupDetails(groupId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError({ ...error, member: "Error removing member: " + err.message });
    } finally {
      setLoading({ ...loading, removeMember: false });
    }
  };

  // Create a transaction
  const createTransaction = async (groupId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (transaction.amount <= 0) {
      setError({ ...error, transaction: "Transaction amount must be greater than 0" });
      return;
    }
    if (!transaction.payerId) {
      setError({ ...error, transaction: "Please select a payer" });
      return;
    }
    if (transaction.splitType === "Specific" && !transaction.specificMemberId) {
      setError({ ...error, transaction: "Please select a member for the specific transaction" });
      return;
    }
    if (["Percentage", "Dynamically"].includes(transaction.splitType) && Object.keys(transaction.splits).length === 0) {
      setError({ ...error, transaction: "Please specify transaction splits" });
      return;
    }
    if (transaction.splitType === "Percentage") {
      const totalPercentage = Object.values(transaction.splits).reduce((sum, val) => sum + Number(val), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError({ ...error, transaction: "Percentages must sum to 100%" });
        return;
      }
    }
    if (transaction.splitType === "Dynamically") {
      const totalAmount = Object.values(transaction.splits).reduce((sum, val) => sum + Number(val), 0);
      if (Math.abs(totalAmount - transaction.amount) > 0.01) {
        setError({ ...error, transaction: "Split amounts must sum to the transaction amount" });
        return;
      }
    }
    setLoading({ ...loading, createTransaction: true });
    try {
      console.log(`Creating transaction for group ${groupId}:`, transaction);
      let splits = {};
      if (transaction.splitType === "Equal") {
        splits = {};
      } else if (transaction.splitType === "Specific") {
        splits[transaction.specificMemberId] = transaction.amount;
      } else {
        splits = transaction.splits;
      }
      const response = await fetch(`https://localhost:7061/api/group/${groupId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerId: parseInt(transaction.payerId),
          amount: parseFloat(transaction.amount.toFixed(2)),
          splitType: transaction.splitType,
          splits
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create transaction: ${errorText || response.statusText}`);
      }
      setTransaction({ payerId: "", amount: 0, splitType: "Equal", splits: {}, specificMemberId: "" });
      setShowTransactionForm(false);
      setSuccess("Transaction created successfully!");
      await fetchGroupDetails(groupId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Create transaction error:", err);
      setError({ ...error, transaction: "Error creating transaction: " + err.message });
    } finally {
      setLoading({ ...loading, createTransaction: false });
    }
  };

  // Settle balance for a member
  const settleBalance = async (groupId, debtorId, creditorId, amount) => {
    setLoading({ ...loading, settle: true });
    try {
      const response = await fetch(`https://localhost:7061/api/group/${groupId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debtorId, creditorId, amount: parseFloat(amount.toFixed(2)) })
      });
      if (!response.ok) throw new Error(await response.text());
      setSuccess("Balance settled successfully!");
      await fetchGroupDetails(groupId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setModalError("Error settling balance: " + err.message);
    } finally {
      setLoading({ ...loading, settle: false });
    }
  };

  // Calculate equal split amount
  const calculateEqualSplit = () => {
    if (!groupDetails || transaction.splitType !== "Equal") return "0.00";
    const count = groupDetails.members?.length || 0;
    return count > 0 ? (transaction.amount / count).toFixed(2) : "0.00";
  };

  useEffect(() => {
    if (id) fetchGroupDetails(id);
    else fetchGroups();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-indigo-100 p-6">
      <div className="container mx-auto max-w-4xl bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold text-indigo-800 mb-8 text-center">Group Expense Tracker</h1>

        {modalError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
              <p className="text-gray-700 mb-4">{modalError}</p>
              <button
                onClick={() => setModalError("")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {error.global && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
            {error.global}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg">
            {success}
          </div>
        )}

        {!groupDetails && (
          <>
            <CreateGroup
              newGroupTitle={newGroupTitle}
              setNewGroupTitle={setNewGroupTitle}
              createGroup={createGroup}
              loading={loading.createGroup}
            />
            <GroupsList
              groups={groups}
              loading={loading.fetch}
              navigate={navigate}
            />
          </>
        )}

        {groupDetails && (
          <GroupDetails
            groupDetails={groupDetails}
            setGroupDetails={setGroupDetails}
            navigate={navigate}
            error={error}
            newMemberUsername={newMemberUsername}
            setNewMemberUsername={setNewMemberUsername}
            addMember={addMember}
            removeMember={removeMember}
            transaction={transaction}
            setTransaction={setTransaction}
            showTransactionForm={showTransactionForm}
            setShowTransactionForm={setShowTransactionForm}
            createTransaction={createTransaction}
            settleBalance={settleBalance}
            expandedMember={expandedMember}
            setExpandedMember={setExpandedMember}
            loading={loading}
            calculateEqualSplit={calculateEqualSplit}
          />
        )}
      </div>
    </div>
  );
}

export default App;
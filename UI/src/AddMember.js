function AddMember({ newMemberUsername, setNewMemberUsername, addMember, loading }) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-medium text-indigo-700 mb-4">Add Member</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newMemberUsername}
            onChange={(e) => setNewMemberUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            onClick={addMember}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading}
          >
            Add Member
          </button>
        </div>
      </div>
    );
  }
  
  export default AddMember;
function CreateGroup({ newGroupTitle, setNewGroupTitle, createGroup, loading }) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Create New Group</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            placeholder="Enter group title"
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            onClick={createGroup}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading}
          >
            Create Group
          </button>
        </div>
      </div>
    );
  }
  
  export default CreateGroup;
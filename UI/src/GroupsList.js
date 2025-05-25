function GroupsList({ groups, loading, navigate }) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Your Groups</h2>
        {loading && <p className="text-gray-500">Loading groups...</p>}
        <div className="grid gap-4">
          {groups.length === 0 && !loading ? (
            <p className="text-gray-500">No groups yet. Create one to get started!</p>
          ) : (
            groups.map(group => (
              <div key={group.id} className="border border-gray-200 p-4 rounded-lg hover:bg-indigo-50">
                <button
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  {group.title}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  
  export default GroupsList;
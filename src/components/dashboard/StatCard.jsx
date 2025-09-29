const StatCard = ({ title, value, icon, color = 'bg-indigo-500', change }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
              {change !== undefined && change !== null && (
                <span className={`text-sm font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
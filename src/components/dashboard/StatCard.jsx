const StatCard = ({ title, value, icon, color = 'from-indigo-500 to-blue-500', change }) => {
  return (
    <div className={`glass rounded-2xl shadow-lg p-6 bg-gradient-to-br ${color}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">{value}</p>
            {change !== undefined && change !== null && (
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                change >= 0 ? 'bg-green-500/50 text-white' : 'bg-red-500/50 text-white'
              }`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        <div className="p-4 bg-white/20 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
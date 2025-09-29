const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className="p-3 bg-indigo-500 rounded-full">
            {icon}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
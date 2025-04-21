'use client';

export function EconAnalysisChoice() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Economic Analysis Available
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          This query may benefit from economic data analysis. Would you like to include this?
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            type="submit" 
            name="choice" 
            value="false"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            No, Skip
          </button>
          <button 
            type="submit" 
            name="choice" 
            value="true"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Yes, Include Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

export function BookingStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded"></div>
        <span className="text-sm">Confirmed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
        <span className="text-sm">Pending</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded"></div>
        <span className="text-sm">Cancelled</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded"></div>
        <span className="text-sm">Completed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-purple-500 rounded"></div>
        <span className="text-sm">No Show</span>
      </div>
    </div>
  )
}


interface StatusIndicatorProps {
  isOn: boolean
  onText?: string
  offText?: string
  className?: string
}

export function StatusIndicator({ isOn, onText = "On", offText = "Off", className = "" }: StatusIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${isOn ? "bg-green-500" : "bg-gray-400"}`} />
      <span className={`text-sm font-medium ${isOn ? "text-green-700" : "text-gray-500"}`}>
        {isOn ? onText : offText}
      </span>
    </div>
  )
}

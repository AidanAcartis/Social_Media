export default function Card({ children, noPadding = false, className = '' }) {
  const baseClasses = 'bg-white shadow-sm shadow-gray-300 rounded-md mb-5'
  const paddingClasses = noPadding ? '' : 'p-4'
  
  return (
    <div className={`${baseClasses} ${paddingClasses} ${className}`}>
      {children}
    </div>
  )
}
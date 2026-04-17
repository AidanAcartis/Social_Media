export default function Card({ children, noPadding = false, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-sm mb-4 ${noPadding ? '' : 'p-5'} ${className}`}>
      {children}
    </div>
  )
}
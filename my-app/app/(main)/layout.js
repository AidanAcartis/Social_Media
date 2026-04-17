import NavigationCard from '../components/ui/NavigationCard'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar moderne avec effet sticky */}
          <aside className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-6 transition-all duration-300">
              <NavigationCard />
            </div>
          </aside>

          {/* Contenu principal avec animation d'entrée */}
          <main className="flex-1 min-w-0">
            <div className="animate-fade-in-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
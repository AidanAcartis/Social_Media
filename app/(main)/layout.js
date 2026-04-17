import NavigationCard from '@/components/ui/NavigationCard'

export default function MainLayout({ children }) {
  return (
    <div className="md:flex mt-4 max-w-4xl mx-auto gap-6 mb-24 md:mb-0">
      <div className="fixed w-full md:static bottom-0 md:w-3/12 -mb-5">
        <NavigationCard />
      </div>
      <div className="mx-4 md:mx-0 md:w-9/12">
        {children}
      </div>
    </div>
  )
}
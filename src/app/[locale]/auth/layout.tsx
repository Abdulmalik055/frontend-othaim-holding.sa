type Props = {
  children: React.ReactNode
}

export default async function AuthGroupLayout({ children }: Props) {
  return (
    <div className="admin-surface min-h-screen bg-[#f4f7fc] flex items-center justify-center px-4 py-8 md:py-10">
      <main className="w-full flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}

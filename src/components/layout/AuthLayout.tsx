type Props = {
  children: React.ReactNode
}

export function AuthLayout({ children }: Props) {
  return (
    <div
      className="admin-surface w-full max-w-[460px] bg-white rounded-[20px] overflow-hidden my-8 md:my-10 border border-[#dde6f5] shadow-[0_12px_32px_rgba(52,89,165,0.12)]"
    >
      {children}
    </div>
  )
}

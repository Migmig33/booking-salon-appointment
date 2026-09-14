import { DEMO_NOTICE } from "../config/salon"

export default function DemoNotice() {
  return (
    <div className="border-b border-warm-line bg-cream-dark px-4 py-1.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-warm-gray">
      {DEMO_NOTICE}
    </div>
  )
}

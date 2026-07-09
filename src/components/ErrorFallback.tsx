import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'

export function ErrorFallback({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Panel solid className="max-w-md w-full p-6 text-center">
        <h1 className="text-lg font-semibold text-[color:var(--color-text)]">
          Something went wrong loading Net Worth
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-muted)] break-words">{message}</p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Panel>
    </div>
  )
}

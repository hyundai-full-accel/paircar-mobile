import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <p className="text-gray-500">페이지를 찾을 수 없어요.</p>
      <Link to="/" className="text-blue-600">
        처음으로
      </Link>
    </main>
  )
}

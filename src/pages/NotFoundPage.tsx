import { Link } from 'react-router'
import { EmptyView } from '../components/StatusView'

export function NotFoundPage() {
  return (
    <EmptyView message="페이지를 찾을 수 없어요.">
      <Link to="/" className="font-semibold text-brand">
        처음으로
      </Link>
    </EmptyView>
  )
}
